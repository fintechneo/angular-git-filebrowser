import { Injectable, OnDestroy } from '@angular/core';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import { Observable } from 'rxjs/Observable';
import { FileBrowserService } from '../filebrowser.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FileInfo } from '../filebrowser.service';
import { mergeMap, merge, map, tap, take } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { ConflictPick, hasConflicts, getConflictVersion } from './resolveconflict';
import { throwError } from 'rxjs';

/*
 * These are used in the worker - but we declare them here so that typescript doesn't complain
 */
declare var importScripts;
declare var Module;
declare var FS;
declare var IDBFS;
declare var self;

function hex(buffer) {
    const hexCodes = [];
    const view = new DataView(buffer);
    for (let i = 0; i < view.byteLength; i += 4) {
      // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
      const value = view.getUint32(i);
      // toString(16) will give the hex representation of the number without padding
      const stringValue = value.toString(16);
      // We use concatenation and slice for padding
      const padding = '00000000';
      const paddedValue = (padding + stringValue).slice(-padding.length);
      hexCodes.push(paddedValue);
    }

    // Join all the hex strings into one
    return hexCodes.join('');
}

@Injectable()
export class GitBackendService extends FileBrowserService implements OnDestroy {

    workerReady: AsyncSubject<boolean> = new AsyncSubject();

    worker: Worker;
    syncInProgress = false;
    repositoryOpen = false;
    mountdir: string;
    workermessageid = 1;
    resolvemap: {[id: number]: Function} = {};

    dirlisteners: {[dir: string]: BehaviorSubject<FileInfo[]>} = {};

    convertUploadsToLFSPointer = false;
    gitLFSEndpoint = '/fintechneo/browsergittestdata.git/info';
    gitLFSAuthorizationHeaderValue =  'Basic ' + btoa('username:password');

    currentStatus: BehaviorSubject<string> = new BehaviorSubject(null);

    /**
     * Set to true to disable syncing filesystem with indexedDB
     */
    syncLocalFSDisabled = false;

    constructor(
        private http: HttpClient
    ) {
        super();
    }

    mount(dir: string): Observable<any> {
        if (this.mountdir) {
            throwError('Mount already called');
        }

        this.currentStatus.next('Mounting local filesystem');

        this.mountdir = dir;
        // The "stupid" worker is simply evaluating scripts that we pass on to it
        this.worker = new Worker('assets/stupid_worker.js');
        this.worker.onmessage = (msg) => {
            if (msg.data.id) {
                if (msg.data.error) {
                    this.resolvemap[msg.data.id]({error: msg.data.error});
                } else {
                    this.resolvemap[msg.data.id](msg.data.response);
                }
                delete this.resolvemap[msg.data.id];
            } else if (msg.data.progressmessage) {
                this.currentStatus.next(msg.data.progressmessage);
            }
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
                    self.jsgitprogresscallback = (msg) => {
                        console.log(msg);
                        self.postMessage({
                            progressmessage: msg
                        });
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
                                self.jsgitsetuser(self.gituserfullname, self.gituseremail);
                                self.jsgitstatus();
                            })
                        ).pipe(
                            tap(() => this.repositoryOpen = true),
                            mergeMap(() => this.readdir())
                        );
                } else {
                    return of(null);
                }
            }),
            tap(() => {
                this.workerReady.next(true);
                this.workerReady.complete();
                this.currentStatus.next(null);
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
            this.resolvemap[workermessageid] = (result) => {
                if (result && result.error) {
                    reject(result.error);
                } else {
                    resolve(result);
                }
            };
            this.worker.postMessage({
                func: func.toString(),
                params: params,
                id: workermessageid
            });
        });
    }

    callWorker2(func, params?: any): Observable<any> {
        return new Observable((observer) => {
            const workermessageid = this.workermessageid++;
            this.resolvemap[workermessageid] = (result) => {
                if (result && result.error) {
                    observer.error(result.error);
                } else {
                    observer.next(result);
                }
            };
            this.worker.postMessage({
                func: func.toString(),
                params: params,
                id: workermessageid
            });
        });
    }

    clone(url: string): Observable<any> {
        this.currentStatus.next('Cloning remote repository');
        return this.workerReady
            .pipe(
                mergeMap(() =>
                    this.callWorker2((params) => {
                            self.jsgitclone(params.url, self.workdir);
                            self.jsgitstatusresult = [];
                            FS.chdir(self.workdir);
                            self.jsgitsetuser(self.gituserfullname, self.gituseremail);
                        }, {url: url})
                ),
                mergeMap(() => this.syncLocalFS(false)),
                tap(() => this.repositoryOpen = true),
                tap(() => this.updateAllDirListeners()),
                tap(() => this.currentStatus.next(null))
            );
    }

    readdir(): Observable<FileInfo[]> {
        return this.callWorker2(() =>
                FS.readdir('.')
                    .map(name => Object.assign({
                        name: name,
                        fullpath: FS.cwd() + '/' + name
                    }, FS.stat(name))
                    )
                    .map(fileinfo =>
                        Object.assign(fileinfo,
                            { isDir: FS.isDir(fileinfo.mode) }
                        )
                    )
            )
            .pipe(
                mergeMap((files: FileInfo[]) =>
                    this.repositoryOpen ?
                        this.listConflicts().pipe(
                            map(cf => files.map(f =>
                                Object.assign(f, {
                                    conflict: cf.findIndex(c =>
                                            f.fullpath.substring(('/' + this.mountdir + '/').length) === c) > -1
                                }))
                            )
                        ) :
                        of(files)
                ),
                tap((ret: FileInfo[]) =>
                    this.fileList.next(ret)
                ),
                tap(() =>
                    this.currentpath.pipe(
                        take(1),
                        tap(p => this.updateDirListener(p.join('/')))
                    )
            )
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

    listConflicts(): Observable<string[]> {
        return this.callWorker2(() => {
            return self.jsgitstatusresult.filter(r => r.status === 'conflict')
                .map(c => c.our);
        });
    }

    listTextFileConflicts(): Observable<string[]> {
        return this.callWorker2(() => {
            return self.jsgitstatusresult.filter(r =>
                    r.status === 'conflict' &&
                    r.binary === 0)
                .map(c => c.our);
        });
    }

    quickResolveConflict(fileName, chooseConflictSide: ConflictPick): Observable<any> {
        return this.getTextFileContentsResolveConflicts(fileName, chooseConflictSide)
            .pipe(
                mergeMap(resolvedContents =>
                    this.saveTextFile(fileName, resolvedContents)
                )
            );
    }

    markConflictsResolved(): Observable<any> {
        return this.callWorker2(() => {
            const conflictstatusresults = self.jsgitstatusresult.filter(c => c.status === 'conflict');
            conflictstatusresults.forEach(c => self.jsgitadd(c.our));
            self.jsgitresolvemergecommit();
        });
    }

    commitChanges(): Observable<any> {
        return fromPromise(this.callWorker((params) => {
            self.jsgitstatus();

            const noconflictstatusresults = self.jsgitstatusresult.filter(c => c.status !== 'conflict');
            const conflictstatusresults = self.jsgitstatusresult.filter(c => c.status === 'conflict');
            if (conflictstatusresults.length > 0) {
                console.log('Resolve conflicts before commiting changes.');
                return;
            }

            if (self.jsgitworkdirnumberofdeltas() > 0
                || noconflictstatusresults.length > 0) {

                    noconflictstatusresults.forEach(p => {
                    if (p.status === 'deleted') {
                        self.jsgitremove(p.path);
                    } else {
                        if ((p.path as string).endsWith('/')) {
                            FS.readdir(self.fromGitPath(p.path))
                                .filter((f: string) => f.charAt(0) !== '.')
                                .forEach(f =>
                                    self.jsgitadd(p.path + f)
                            );
                        }
                        self.jsgitadd(p.path);
                    }
                });
                self.jsgitaddfileswithchanges();
                self.jsgitcommit(
                    'Revision ' + new Date().toJSON()
                );
                console.log('Changes committed');
            } else {
                console.log('No changes');
            }
        })).pipe(
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    getDownloadObjectUrl(filename: string): Observable<string> {
        return this.callWorker2(params => {
                const contents: Uint8Array = FS.readFile(params.filename);
                const lfsheader = `version https://git-lfs.github.com/spec/v1`;
                const isLFSPointer = String.fromCharCode.apply(null, contents.subarray(0, lfsheader.length)) === lfsheader;
                if (isLFSPointer) {
                    return FS.readFile(params.filename, {encoding: 'utf8'});
                } else {
                    return URL.createObjectURL(new Blob([contents], { type: 'application/octet-stream' }));
                }
            }, {filename: filename}
        ).pipe(
            mergeMap((url: string) => {
                if (url.indexOf('version ') === 0) {
                    return this.getLFSDownloadURL(url);
                } else {
                    return of(url);
                }
            })
        );
    }

    getTextFileContentsResolveConflicts(filename: string,  chosenConclictSide: ConflictPick): Observable<string> {
        return this.getTextFileContents(filename)
            .pipe(
                mergeMap(contents => {
                    if (hasConflicts(contents)) {
                        const resolved = getConflictVersion(contents, chosenConclictSide);
                        return this.saveTextFile(filename, resolved)
                            .pipe(map(() => resolved));
                    } else {
                        return of(contents);
                    }
                })
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
        if (this.convertUploadsToLFSPointer) {
            let filecontents: Uint8Array;
            return new Observable<string>(observer => {
                const filereader = new FileReader();
                filereader.readAsArrayBuffer(file);

                filereader.onload = async () => {
                    filecontents = new Uint8Array(filereader.result as ArrayBuffer);
                    const hashbuf = await window.crypto.subtle.digest('SHA-256',
                        filecontents
                    );
                    const lfsPointerText = `version https://git-lfs.github.com/spec/v1\n` +
                                            `oid sha256:${hex(hashbuf)}\n` +
                                            `size ${filecontents.length}\n`;

                    observer.next(lfsPointerText);
                };
            }).pipe(
                mergeMap((lfsPointerText) =>
                    this.saveTextFile(file.name, lfsPointerText).pipe(
                        mergeMap(() => this.uploadToLFSStorage(lfsPointerText, filecontents))
                    )
                ),
                tap(() => this.gitLFSTrack(file.name))
            );
        } else {
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
    }

    mkdir(dirname: string): Observable<any> {
        return fromPromise(
            this.callWorker(params => {
                    FS.mkdir(params.dirname);
                }, {dirname: dirname}
            )
        ).pipe(
            mergeMap(() => this.readdir()),
            mergeMap(() => this.syncLocalFS(false))
        );
    }

    rmdir(dirname: string): Observable<any> {
        return this.callWorker2((params) => {
            const dirnameparts: string[] = params.dirname.split('/');
            if (dirnameparts.length > 1) {
                FS.chdir('/' + dirnameparts.slice(0, dirnameparts.length - 1).join('/'));
                console.log('cwd', FS.cwd());
            }
            const recursedir = (path) =>
                FS.readdir(path)
                    .filter((f: string) => !f.startsWith('.'))
                    .forEach((f: string) => {
                        const deletepath = path + '/' + f;
                        console.log('Deleting', deletepath);
                        if (FS.isDir(FS.stat(deletepath).mode)) {
                            recursedir(deletepath);
                            FS.rmdir(deletepath);
                        } else {
                            FS.unlink(deletepath);
                        }
                    });
            recursedir(params.dirname);

            FS.rmdir(params.dirname);
            console.log('Removed directory', params.dirname);
        }, {dirname: dirname}).pipe(
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
        this.currentStatus.next('Pushing local changes to server');
        return this.callWorker2(() => {
                    self.jsgitpush();
                }, {}
            ).pipe(tap(() => this.currentStatus.next(null)));
    }

    pull() {
        this.currentStatus.next('Pulling recent changes from server');
        return this.callWorker2(() => {
                    self.jsgitpull();
                    // Update status after pull
                    self.jsgitstatus();
                }, {}
        ).pipe(
            tap(() => this.currentStatus.next(null)),
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
        console.log('synclocalfs called', direction, this.syncInProgress);
        if (this.syncLocalFSDisabled) {
            console.log('synclocalfs is disabled');
            return of(false);
        }
        if (this.syncInProgress) {
            return of(true);
        } else {
            this.syncInProgress = true;
            return new Observable(observer => {
                this.callWorker((params) =>
                    new Promise<any>((resolve, reject) =>
                        FS.syncfs(params.direction, () => {
                            console.log(params.direction ? 'reload persisted' : 'persisted');
                            resolve();
                        })
                    ),
                    {direction: direction}
                ).then(() => {
                    this.syncInProgress = false;
                    observer.next();
                });
            });
        }
    }

    unmount() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            console.log('Git backend service terminated');
            this.mountdir = null;
            this.repositoryOpen = false;
            this.currentStatus.complete();
        }
    }

    /**
     * jsgit doesn't read the host name and protocol from the url so need to set it from here
     * @param host e.g. https://github.com
     */
    setHost(host: string) {
        this.callWorker2((params) =>
            Module.jsgithost = params.host,
            {host: host}
        ).subscribe();
    }

    /**
     * Set name and email to be used for commit
     * @param name
     * @param email
     */
    setUser(name: string, email: string) {
        this.callWorker2((params) => {
                self.gituserfullname = params.name;
                self.gituseremail = params.email;
            },
            {name: name, email: email}
        ).subscribe();
    }

    /**
     * Additional headers to send with http request, e.g. authorization tokens
     * @param headers
     */
    setHeaders(headers: HttpHeaders) {
        this.callWorker2((params) =>
            Module.jsgitheaders = params.headers,
            {
                headers: headers.keys().map(key =>
                    ({name: key, value: headers.get(key)}))
            }
        ).subscribe();
    }

    history(): Observable<any> {
        return this.callWorker2(() => {
            self.jsgithistory();
            return self.jsgithistoryresult;
        });
    }

    /**
     * Similar to e.g.: git lfs track "*.psd"
     *
     *  Will update .gitattributes
     * @param pattern
     */
    public gitLFSTrack(filenameorpattern: string) {
        this.callWorker2((params) => {
            console.log('gitLFStrac', params);
            const pattern = params.pattern.replace(/\s/g, '[[:space:]]');
            let hasPattern = false;
            let gitattributeslines = [];
            try {
                gitattributeslines = FS.readFile('.gitattributes', {encoding: 'utf8'}).split('\n');
            } catch (e) {}
            const patternparts = pattern.split(/\./);
            const extension = patternparts[patternparts.length - 1];
            hasPattern = gitattributeslines.find(line => {
                const linepattern = line.split(' ')[0];
                const lineextension = linepattern.split('.')[1];

                return line.indexOf('filter=lfs') > 0 &&
                    line.indexOf(`${pattern} `) === 0 ||
                    (line.charAt(0) === '*' && lineextension === extension);
            }) ? true : false;

            if (!hasPattern) {
                gitattributeslines.push(`${pattern} filter=lfs diff=lfs merge=lfs -text`);
                FS.writeFile('.gitattributes', gitattributeslines.join('\n'));
            }
            console.log(gitattributeslines);
        }, {pattern: filenameorpattern}).subscribe();
    }

    private uploadToLFSStorage(lfsPointer: string, contents: Uint8Array) {
        const lfsPointerLines = lfsPointer.split('\n');
        const sha256sum = lfsPointerLines[1].substring('oid sha256:'.length);
        const size = parseInt(lfsPointerLines[2].substring('size '.length), 10);

        return this.http
            .post(this.gitLFSEndpoint + '/lfs/objects/batch',
                {
                    'operation': 'upload',
                    'transfers': [ 'basic' ],
                    // 'ref': { 'name': 'refs/heads/master' },
                    'objects': [
                        {
                            'oid': sha256sum,
                            'size': size,
                        }
                    ]
                },
                {
                    headers: {
                        'Authorization': this.gitLFSAuthorizationHeaderValue,
                        'Accept': 'application/vnd.git-lfs+json',
                        'Content-Type': 'application/vnd.git-lfs+json'
                    }
                }
        ).pipe(
            tap(ret => console.log(ret)),
            mergeMap(
                (ret: any) => {
                    const uploadobj = ret.objects[0].actions.upload;
                    if (!uploadobj && ret.objects[0].actions.download) {
                        console.log('Already uploaded', sha256sum);
                        return of(true);
                    }
                    const verifyobj = ret.objects[0].actions.verify;

                    const headers = uploadobj.header;

                    let url = uploadobj.href;

                    url = url.replace('https://github-cloud.s3.amazonaws.com', '');

                    return this.http.put(url, contents.buffer, {headers: headers})
                        .pipe(
                            mergeMap(() => verifyobj ?
                                this.http.post(verifyobj.href.replace('https://lfs.github.com', ''), {
                                    oid: sha256sum,
                                    size: size
                            }, {headers: verifyobj.header})
                            : of(true)
                        )
                    );
                }
            )
        );
    }

    getLFSDownloadURL(lfsPointer: string): Observable<string> {
        const lfsPointerLines = lfsPointer.split('\n');
        const sha256sum = lfsPointerLines[1].substring('oid sha256:'.length);
        const size = parseInt(lfsPointerLines[2].substring('size '.length), 10);
        return this.http
            .post(this.gitLFSEndpoint + '/lfs/objects/batch',
                {
                    'operation': 'download',
                    'transfers': [ 'basic' ],
                    // 'ref': { 'name': 'refs/heads/master' },
                    'objects': [
                        {
                        'oid': sha256sum,
                        'size': size,
                        }
                    ]
                },
                {
                    headers: {
                        'Authorization': this.gitLFSAuthorizationHeaderValue,
                        'Accept': 'application/vnd.git-lfs+json',
                        'Content-Type': 'application/vnd.git-lfs+json'
                    }
                }
        ).pipe(map(
            (ret: any) => ret.objects[0].actions.download.href
        ));
    }

    ngOnDestroy() {
        this.unmount();
    }
}
