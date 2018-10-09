import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { Observable, AsyncSubject } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { GitBackendService, FileBrowserService } from '../../lib/filebrowser.module';
import { query } from '@angular/animations';

@Injectable()
export class RepositoryService implements OnDestroy {

    gitbackendservice: GitBackendService;
    synchronizeLockSubject: AsyncSubject<any> = null;
    filesysReadySubject: AsyncSubject<any> = new AsyncSubject();

    workdir;

    constructor(
        private filebrowserservice: FileBrowserService,
        public snackBar: MatSnackBar,
        public route: ActivatedRoute,
        private http: HttpClient
    ) {
        this.gitbackendservice = this.filebrowserservice as GitBackendService;
        this.gitbackendservice.convertUploadsToLFSPointer = true;
        this.route.params.pipe(
            tap(params => this.workdir = params.repository),
            mergeMap(params => this.gitbackendservice.mount(params.repository)),
            mergeMap(isGitRepo => {
                if (isGitRepo) {
                    return this.synchronizeChanges();
                } else {
                    return this.route.queryParams.pipe(
                        mergeMap(queryParams =>
                            this.gitbackendservice.clone(queryParams.cloneurl)),
                        mergeMap(() => this.gitbackendservice.readdir())
                    );
                }
            })
        ).subscribe((ret) => {
            console.log('File system ready', ret);
            this.filesysReadySubject.next(true);
            this.filesysReadySubject.complete();
        });
    }


    synchronizeChanges(): Observable<any> {
        if (this.synchronizeLockSubject) {
            return this.synchronizeLockSubject;
        } else {
            this.synchronizeLockSubject = new AsyncSubject();
            const gitbackend = this.filebrowserservice as GitBackendService;

            console.log('Sync changes with server');
            return gitbackend.commitChanges()
                .pipe(
                    mergeMap(() => gitbackend.pull()),
                    mergeMap(() => gitbackend.push()),
                    tap(() => {
                        this.synchronizeLockSubject.next(true);
                        this.synchronizeLockSubject.complete();
                        this.synchronizeLockSubject = null;
                        console.log('Sync done');
                    })
                );
        }
    }

    ngOnDestroy() {
        this.filebrowserservice.ngOnDestroy();
    }
}
