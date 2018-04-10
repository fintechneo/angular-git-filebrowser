import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    templateUrl: 'simpletexteditordialog.component.html'
})
export class SimpleTextEditorDialogComponent {
    content: string;
    constructor(
        private dialogRef: MatDialogRef<SimpleTextEditorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) data: any
    ) {
        this.content = data.contents;
    }

    cancel() {
        this.dialogRef.close();
    }

    save() {
        this.dialogRef.close(this.content);
    }
}
