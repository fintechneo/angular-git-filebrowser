import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    template: `
    <p>File {{fileInfo.name}} was not detected as a text file (type is {{fileInfo.type}}).</p>
    <p>Filesize is {{fileInfo.size}}. While not using LFS will make the file available offline,
    it is recommended to use LFS for larger binary uploads so that they don't take up space in the git repository.
    </p>
    <button mat-button (click)="closeUsingLFS()">Use LFS (recommended)</button>
    <button mat-button (click)="closeNotUsingLFS()">Don't use LFS</button>
    `
})
export class UploadUsingLFSDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<UploadUsingLFSDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public fileInfo: File) {

    }

    closeUsingLFS() {
        this.dialogRef.close(false);
    }

    closeNotUsingLFS() {
        this.dialogRef.close(true);
    }
}
