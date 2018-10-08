import { Component, ViewChild } from '@angular/core';
import { MatPaginator, MatTableDataSource } from '@angular/material';

import { ActivatedRoute } from '@angular/router';
import { RepositoryService } from './repository.service';
import { mergeMap, tap } from 'rxjs/operators';
import { FileBrowserService, GitBackendService } from '../../lib/filebrowser.module';

@Component({
    templateUrl: 'log.component.html'
})
export class LogComponent {

    displayedLogColumns = ['when', 'name', 'email', 'message'];

    @ViewChild(MatPaginator) logPaginator: MatPaginator;
    logdatasource: MatTableDataSource<any>;

    constructor(
        repositoryservice: RepositoryService
    ) {
        repositoryservice.filesysReadySubject
            .pipe(
                mergeMap(() => repositoryservice.gitbackendservice.history())
            )
            .subscribe( log => {
                    console.log(log);
                    this.logdatasource = new MatTableDataSource(log);
                    this.logdatasource.paginator = this.logPaginator;
                }
            );
    }
}
