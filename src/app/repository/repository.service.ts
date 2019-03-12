import { Injectable, OnDestroy } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

import { Observable, AsyncSubject } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { GitBackendService, FileBrowserService } from '../../lib/filebrowser.module';
import { GitProgressSnackbarComponent } from '../../lib/gitbackend/gitprogresssnackbar.component';
import { CredientialsService } from './credentials.service';

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
        credentialsService: CredientialsService
    ) {
        credentialsService.storeCredentialsInSessionStorage();
        this.gitbackendservice = this.filebrowserservice as GitBackendService;
        this.gitbackendservice.convertUploadsToLFSPointer = true;
        const basicAuthHeader = credentialsService.password ?
            'Basic ' + btoa(`${credentialsService.username}:${credentialsService.password}`) : null;
        this.gitbackendservice.proxyHost = credentialsService.proxyhost;
        this.gitbackendservice.gitLFSAuthorizationHeaderValue = basicAuthHeader;

        GitProgressSnackbarComponent.activate(snackBar, this.gitbackendservice);

        this.route.params.pipe(
            tap(params => this.workdir = params.repository),
            mergeMap(params => this.gitbackendservice.mount(params.repository)),
            mergeMap(isGitRepo => {
                if(basicAuthHeader) {
                    this.gitbackendservice.setHeaders(
                        new HttpHeaders(
                            {'Authorization': basicAuthHeader
                        }
                    ));
                }
                this.gitbackendservice.setUser(
                    credentialsService.gitname, credentialsService.gitemail
                );

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
        },err => {
            this.snackBar.open(err.message,'Dismiss');
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
