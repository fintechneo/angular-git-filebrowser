import { Component } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { FileBrowserService, GitBackendService } from '../../lib/filebrowser.module';
import { RepositoryService } from './repository.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { Observable } from 'rxjs';

@Component({
  templateUrl: './repository.component.html',
  providers: [
    {
      provide: FileBrowserService,
      useClass: GitBackendService,
      deps: [HttpClient]
    },
    RepositoryService
  ]
})
export class RepositoryComponent {

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private snackbar: MatSnackBar
    ) {

    }

    deleteLocal() {

        this.router.navigateByUrl('/')
            .then(() => {

                this.route.params.subscribe(params =>  {
                    console.log(`Deleting database ${params.repository}`);
                    new Observable(observer => {
                        const req = window.indexedDB.deleteDatabase('/' + params.repository);
                        req.onsuccess = () => observer.next(true);
                        req.onerror = (err) => observer.error(err);
                    }).subscribe(
                        () => {
                            console.log('deleted git repo', '/' +  params.repository);
                            this.snackbar.open('deleted git repo /' + params.repository, 'OK');
                        },
                        (err) => this.snackbar.open('error deleting git repo /' + params.repository, 'Dismiss'),
                    );
                });
            });
    }
}
