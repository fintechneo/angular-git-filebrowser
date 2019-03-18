import { NgModule } from '@angular/core';
import { FileBrowserComponent } from './filebrowser.component';
import { MatGridListModule, MatListModule,
        MatToolbarModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule, MatSnackBarModule,
        MatDialogModule,
        MatButtonModule,
        MatTooltipModule} from '@angular/material';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SinglefolderviewComponent } from './singlefolderview/singlefolderview.component';
import { SimpleTextEditorDialogComponent } from './simpletexteditordialog.component';
import { GitProgressSnackbarComponent } from './gitbackend/gitprogresssnackbar.component';
export { GitProgressSnackbarComponent } from './gitbackend/gitprogresssnackbar.component';
export { FileBrowserComponent } from './filebrowser.component';
export { FileBrowserService, FileInfo } from './filebrowser.service';
export { GitBackendService, GIT_MERGE_FILE_FAVOR } from './gitbackend/gitbackend.service';
export * from './gitbackend/resolveconflict';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        MatListModule,
        MatButtonModule,
        MatInputModule,
        MatToolbarModule,
        MatGridListModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule
    ],
    declarations: [
        FileBrowserComponent,
        SinglefolderviewComponent,
        SimpleTextEditorDialogComponent,
        GitProgressSnackbarComponent
    ],
    exports: [
        FileBrowserComponent,
        SinglefolderviewComponent
    ],
     entryComponents: [
        SimpleTextEditorDialogComponent,
        GitProgressSnackbarComponent
     ]
})
export class FileBrowserModule {

}
