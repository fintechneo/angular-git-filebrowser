import { Injectable } from '@angular/core';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import { Observable } from 'rxjs/Observable';
import { FileBrowserService } from '../filebrowser.module';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FileInfo } from '../filebrowser.service';
import { mergeMap, merge } from 'rxjs/operators';
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
export class GitBackendService extends FileBrowserService {

    workerReady: AsyncSubject<boolean> = new AsyncSubject();

    worker: Worker;
    syncInProgress = false;

    constructor() {
        super();
        // The "stupid" worker is simply evaluating scripts that we pass on to it
        this.worker = new Worker('assets/stupid_worker.js');

        // Set up emscripten with libgit2 (inside worker)
        this.callWorker(() => {

            return new Promise((resolve, reject) => {
                importScripts('libgit2.js');
                Module['onRuntimeInitialized'] = () => {
                    const dir = 'workdir';
                    FS.mkdir(dir, '0777');
                    FS.mount(IDBFS, {}, '/' + dir);
                    FS.chdir('/' + dir);

                    self.jsgitinit = Module.cwrap('jsgitinit', null, []);
                    self.jsgitclone = Module.cwrap('jsgitclone', null, ['string', 'string']);
                    self.jsgitopenrepo = Module.cwrap('jsgitopenrepo', null, []);
                    self.jsgitadd = Module.cwrap('jsgitadd', null, ['string']);
                    self.jsgitcommit = Module.cwrap('jsgitcommit', null, ['string']);
                    self.jsgitpush = Module.cwrap('jsgitpush', null, []);
                    self.jsgitpull = Module.cwrap('jsgitpull', null, []);
                    self.jsgitshutdown = Module.cwrap('jsgitshutdown', null, []);
                    self.jsgitprintlatestcommit = Module.cwrap('jsgitprintlatestcommit', null, []);
                    self.jsgitcommit = Module.cwrap('jsgitcommit', null, ['string', 'string', 'string', 'number', 'number']);
                    self.jsgitinit();

                    resolve();
                };
            });
        }).then(() => {
            this.syncLocalFS(true)
                .pipe(mergeMap(() => this.readdir()))
               .subscribe(() => {
                    this.workerReady.next(true);
                    this.workerReady.complete();
                });
        });

    }

    /**
     * Convert function to string source code and send it to the worker for evaluation
     * @param func the function to send
     * @param params an object that will be JSON stringified and passed to the function
     */
    callWorker(func, params?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.worker.onmessage = (msg) => resolve(msg.data);
            const workerMessage = '(' + func.toString() + ')(' + (params ? JSON.stringify(params) : '') + ')';
            this.worker.postMessage(workerMessage);
        });
    }

    clone(url: string): Observable<any> {
        return this.workerReady
            .pipe(
                mergeMap(() =>
                    new Observable(observer => {
                    this.callWorker((params) => {
                            self.jsgitclone(params.url, 'workdir');
                            FS.chdir('workdir');
                        }, {url: url})
                        .then(() => observer.next());
                    })
                ),
                mergeMap(() => this.syncLocalFS(false))
            );
    }

    readdir(): Observable<FileInfo[]> {
        return new Observable(observer => {
            this.callWorker(() => {
                    return FS.readdir('.')
                            .map(name => Object.assign({
                                name: name
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
            });
    }

    changedir(name: string) {
        this.callWorker((params) => FS.chdir(params.name), {name: name})
            .then(() => this.readdir().subscribe());
    }

    unlink(filename: string): Observable<any> {
        return new Observable(observer => {
            this.callWorker((params) =>
                FS.unlink(params.filename), {filename: filename})
                .then(() => observer.next(true));
        }).pipe(
            mergeMap(() => this.readdir()),
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    getDownloadObjectUrl(filename: string): Observable<string> {
        return fromPromise(
            this.callWorker(params => {
                    return URL.createObjectURL(new Blob([FS.readFile(params.filename)], { type: 'application/octet-stream' }));
                }, {filename: filename}
            )
        );
    }

    uploadFile(file: File): Observable<any> {
        return new Observable(observer => {
            this.callWorker((params) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', params.url, false);
                xhr.send();
                FS.writeFile(params.name, xhr.response);
                console.log('Written file', params.name);
            }, {url: URL.createObjectURL(file), name: file.name})
                .then(() => observer.next(file.name));
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
}
