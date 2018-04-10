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
export { FileBrowserService } from './filebrowser.service';
export { GitBackendService } from './gitbackend/gitbackend.service';

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
        SimpleTextEditorDialogComponent
    ],
    exports: [
        FileBrowserComponent,
        SinglefolderviewComponent
    ],
     entryComponents: [
        SimpleTextEditorDialogComponent
     ]
})
export class FileBrowserModule {

}
