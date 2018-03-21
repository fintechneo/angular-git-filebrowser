import { Injectable } from '@angular/core';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import { Observable } from 'rxjs/Observable';
import { FileBrowserService } from '../filebrowser.module';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

declare var importScripts;
declare var Module;
declare var FS;
declare var IDBFS;
declare var self;

@Injectable()
export class GitBackendService extends FileBrowserService {

    workerReady: AsyncSubject<boolean> = new AsyncSubject();

    worker: Worker;
    constructor() {
        super();
        this.worker = new Worker('assets/stupid_worker.js');
        // Set up emscripten with libgit2
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
            this.workerReady.next(true),
                this.workerReady.complete();
        });

    }

    callWorker(func, params?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.worker.onmessage = (msg) => resolve(msg.data);
            const workerMessage = '(' + func.toString() + ')(' + (params ? JSON.stringify(params) : '') + ')';
            this.worker.postMessage(workerMessage);
        });
    }

    clone(url: string): Observable<any> {
        return new Observable(observer => {
            this.callWorker((params) => {
                    self.jsgitclone(params.url, 'workdir');
                    FS.chdir('workdir');
                }, {url: url})
                .then(() => observer.next());
            });
    }

    readdir(): Observable<string[]> {
        return new Observable(observer => {
            this.callWorker(() => {
                    return FS.readdir('.');
                })
                .then((ret: string[]) => {
                    console.log(ret);
                    this.fileList.next(
                        ret.filter(s => s[0] !== '.')
                    );
                    observer.next(ret);
                });
            });
    }
}
