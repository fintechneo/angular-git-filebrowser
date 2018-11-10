import { Component } from '@angular/core';
import { GitBackendService } from './gitbackend.service';
import { MatSnackBarRef, MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs';

@Component({
    template: `{{progressmessage | async}}`
})
export class GitProgressSnackbarComponent {
    progressmessage: Subject<string>;

    static activate(
        snackBar: MatSnackBar,
        gitbackendservice: GitBackendService
    ) {
        let snackBarRef: MatSnackBarRef<GitProgressSnackbarComponent>;
        gitbackendservice.currentStatus.subscribe(status => {
            if (status) {
                if (!snackBarRef) {
                    snackBarRef = snackBar.openFromComponent(GitProgressSnackbarComponent);
                }
                snackBarRef.instance.progressmessage = gitbackendservice.currentStatus;
            } else if (snackBarRef) {
                snackBarRef.dismiss();
                snackBarRef = null;
            }
        });
    }
}
