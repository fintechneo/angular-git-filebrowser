import { Injectable, OnDestroy } from '@angular/core';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import { Observable } from 'rxjs/Observable';
import { FileBrowserService } from '../filebrowser.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FileInfo } from '../filebrowser.service';
import { mergeMap, merge, map, tap, take } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { fromPromise } from 'rxjs/observable/fromPromise';

/*
 * These are used in the worker - but we declare them here so that typescript doesn't complain
 */
declare var importScripts;
declare var Module;
declare var FS;
declare var IDBFS;
declare var self;

@Injectable()
export class GitBackendService extends FileBrowserService implements OnDestroy {

    workerReady: AsyncSubject<boolean> = new AsyncSubject();

    worker: Worker;
    syncInProgress = false;
    mountdir: string;
    workermessageid = 1;
    resolvemap: {[id: number]: Function} = {};
    dirlisteners: {[dir: string]: BehaviorSubject<FileInfo[]>} = {};

    constructor() {
        super();
    }

    mount(dir: string): Observable<any> {
        if (this.mountdir) {
            Observable.throw('Mount already called');
        }

        this.mountdir = dir;
        // The "stupid" worker is simply evaluating scripts that we pass on to it
        this.worker = new Worker('assets/stupid_worker.js');
        this.worker.onmessage = (msg) => {
            this.resolvemap[msg.data.id](msg.data.response);
            delete this.resolvemap[msg.data.id];
        };

        // Set up emscripten with libgit2 (inside worker)
        return fromPromise(this.callWorker((params) => {

            return new Promise((resolve, reject) => {

                importScripts('libgit2.js');
                Module['onRuntimeInitialized'] = () => {

                    self.workdir = '/' + params.workdir;

                    FS.mkdir(self.workdir, '0777');
                    FS.mount(IDBFS, {}, self.workdir);
                    FS.chdir(self.workdir);

                    self.fromGitPath = (path) => {
                        const currentdir: string[] = FS.cwd().split('/');
                        const gitroot = self.workdir;
                        return gitroot + '/' + path;
                    };
                    self.toGitPath = (filename) => {
                        const currentdir: string[] = FS.cwd().substring(`${self.workdir}/`.length).split('/');
                        return currentdir.join('/') + '/' + filename;
                    };
                    self.jsgitinit();

                    resolve();
                };
            });
        }, {workdir: dir})
        ).pipe(
            mergeMap(() => this.syncLocalFS(true)),
            mergeMap(() => this.readdir()),
            mergeMap((ret) => {
                const hasGitRepo = ret.find(file => file.name === '.git');
                if (hasGitRepo) {
                    return fromPromise(
                        this.callWorker(() => {
                                console.log('Open repository');
                                self.jsgitopenrepo();
                            })
                        ).pipe(mergeMap(() => of(ret)));
                } else {
                    return of(ret);
                }
            }),
            map(() => {
                this.workerReady.next(true);
                this.workerReady.complete();
            })
        );
    }

    /**
     * Convert function to string source code and send it to the worker for evaluation
     * @param func the function to send
     * @param params an object that will be JSON stringified and passed to the function
     */
    callWorker(func, params?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const workermessageid = this.workermessageid++;
            this.resolvemap[workermessageid] = (result) => resolve(result);
            this.worker.postMessage({
                func: func.toString(),
                params: params,
                id: workermessageid
            });
        });
    }

    clone(url: string): Observable<any> {
        return this.workerReady
            .pipe(
                mergeMap(() =>
                    new Observable(observer => {
                    this.callWorker((params) => {
                            self.jsgitclone(params.url, self.workdir);
                            FS.chdir(self.workdir);
                        }, {url: url})
                        .then(() => observer.next());
                    })
                ),
                mergeMap(() => this.syncLocalFS(false)),
                tap(() => this.updateAllDirListeners())
            );
    }

    readdir(): Observable<FileInfo[]> {
        return new Observable<FileInfo[]>(observer => {
            this.callWorker(() => {
                    return FS.readdir('.')
                            .map(name => Object.assign({
                                name: name,
                                fullpath: FS.cwd() + '/' + name
                            }, FS.stat(name))
                            )
                            .map(fileinfo =>
                                Object.assign(fileinfo,
                                    { isDir: FS.isDir(fileinfo.mode) }
                                )
                            );
                })
                .then((ret: FileInfo[]) => {
                    this.fileList.next(ret);
                    observer.next(ret);
                });
            }
        ).pipe(
            tap(() => this.currentpath.pipe(take(1))
                .subscribe(p => this.updateDirListener(p.join('/'))))
        );
    }

    changedir(name: string): Observable<any> {
        return fromPromise(this.callWorker((params) => FS.chdir(params.name), {name: name})
            ).pipe(
                mergeMap(() => this.readdir()),
                mergeMap(() => fromPromise(this.callWorker(() =>
                    self.toGitPath('').split(/\//).filter(p => p.length > 0)
                ))),
                map((cwd) => this.currentpath.next(cwd))
            );
    }

    unlink(filename: string): Observable<any> {
        return fromPromise(
            this.callWorker((params) => {
                FS.unlink(params.filename);
                console.log('Deleted local file', self.toGitPath(params.filename));
            }, {filename: filename})
        ).pipe(
            mergeMap(() => this.readdir()),
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    commitChanges(): Observable<any> {
        return fromPromise(this.callWorker((params) => {
            self.jsgitstatus();

            if (self.jsgitworkdirnumberofdeltas() > 0
                || self.jsgitstatusresult.length > 0) {

                self.jsgitstatusresult.forEach(p => {
                    if (p.status === 'deleted') {
                        self.jsgitremove(p.path);
                    } else {
                        self.jsgitadd(p.path);
                    }
                });
                self.jsgitaddfileswithchanges();
                self.jsgitcommit(
                    'Revision ' + new Date().toJSON(),
                    'emscripten', 'fintechneo',
                    new Date().getTime() / 1000,
                    new Date().getTimezoneOffset()
                );
                console.log('Changes committed');
            } else {
                console.log('No changes');
            }
        }));
    }

    getDownloadObjectUrl(filename: string): Observable<string> {
        return fromPromise(
            this.callWorker(params => {
                    return URL.createObjectURL(new Blob([FS.readFile(params.filename)], { type: 'application/octet-stream' }));
                }, {filename: filename}
            )
        );
    }

    getTextFileContents(filename: string): Observable<string> {
        return fromPromise(this.callWorker(params => {
                return FS.readFile(params.filename, {encoding: 'utf8'});
            }, {filename: filename}
        ));
    }

    saveTextFile(filename: string, content: string): Observable<any> {
        return fromPromise(this.callWorker(params => {
                return FS.writeFile(params.filename, params.content);
            }, {filename: filename, content: content}
        )).pipe(
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    uploadFile(file: File): Observable<any> {
        return new Observable(observer => {
            this.callWorker((params) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', params.url, false);
                xhr.responseType = 'arraybuffer';
                xhr.send();
                console.log(xhr.response);
                FS.writeFile(params.name, new Uint8Array(xhr.response), {encoding: 'binary'});

                const gitpath = self.toGitPath(params.name);
                console.log('Written file locally', gitpath);
            }, {url: URL.createObjectURL(file), name: file.name})
                .then(() => {
                    observer.next(file.name);
                });
        }).pipe(
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    mkdir(foldername: string): Observable<any> {
        return fromPromise(
            this.callWorker(params => {
                    FS.mkdir(params.foldername);
                }, {foldername: foldername}
            )
        ).pipe(
            mergeMap(() => this.readdir()),
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    rename(oldpath: string, newpath: string): Observable<any> {
        return fromPromise(
            this.callWorker(params => {
                    FS.rename(params.oldpath, params.newpath);
                }, {oldpath: oldpath, newpath: newpath}
            )
        ).pipe(
            mergeMap(() => this.readdir()),
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    push() {
        return fromPromise(
            this.callWorker(() => {
                    self.jsgitpush();
                }, {}
            )
        );
    }

    pull() {
        return fromPromise(
            this.callWorker(() => {
                    self.jsgitpull();
                }, {}
            )
        ).pipe(
            mergeMap(() => this.readdir()),
            mergeMap(() => this.syncLocalFS(false)),
            tap(() => this.updateAllDirListeners())
        );
    }

    listendir(dir: string): Observable<FileInfo[]> {
        if (!this.dirlisteners[dir]) {
            this.dirlisteners[dir] = new BehaviorSubject([]);
            this.updateDirListener(dir);
        }
        return this.dirlisteners[dir];
    }

    updateAllDirListeners() {
        Object.keys(this.dirlisteners).forEach(dir => this.updateDirListener(dir));
    }

    updateDirListener(dir: string) {
        if (!this.dirlisteners[dir]) {
            return;
        }

        setTimeout(() =>
            this.workerReady.subscribe(() => {
                this.callWorker((params) => {
                        const fulldirpath = self.fromGitPath(params.dir);
                        let exists = false;
                        try {
                            FS.stat(fulldirpath);
                            exists = true;
                        } catch (e) {

                        }
                        if (exists) {
                            console.log('update dir listener', fulldirpath, params.dir);
                            return FS.readdir(fulldirpath).map(name => Object.assign({
                                name: name,
                                fullpath: self.fromGitPath(`${params.dir}/${name}`)
                                }, FS.stat(self.fromGitPath(`${params.dir}/${name}`)))
                            )
                            .map(fileinfo =>
                                Object.assign(fileinfo,
                                    { isDir: FS.isDir(fileinfo.mode) }
                                )
                            ).filter(fileinfo => !fileinfo.isDir);
                        } else {
                            return [];
                        }
                    },
                    {dir: dir}
                ).then((files: FileInfo[]) => {
                    console.log(dir, files);
                    this.dirlisteners[dir].next(files);
                });
            }),
        0);
    }

    /**
     *
     * @param direction false = write, true = read
     */
    syncLocalFS(direction: boolean): Observable<any> {
        if (this.syncInProgress) {
            return of(true);
        } else {
            this.syncInProgress = true;
            return new Observable(observer => {
                this.callWorker((params) =>
                    new Promise<any>((resolve, reject) =>
                        FS.syncfs(params.direction, () => resolve())
                    ),
                    {direction: direction}
                ).then(() => {
                    this.syncInProgress = false;
                    observer.next();
                });
            });
        }
    }

    ngOnDestroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            console.log('Git backend service terminated');
        }
    }
}
