import { NgModule } from '@angular/core';
import { FileBrowserComponent } from './filebrowser.component';
import { MatGridListModule, MatListModule,
        MatToolbarModule,
        MatIconModule,
        MatProgressBarModule, MatSnackBarModule,
        MatDialogModule,
        MatButtonModule} from '@angular/material';
import { CommonModule } from '@angular/common';


@NgModule({
    imports: [
        CommonModule,
        MatListModule,
        MatButtonModule,
        MatToolbarModule,
        MatGridListModule,
        MatSnackBarModule,
        MatDialogModule,
        MatIconModule,
        MatProgressBarModule
    ],
    declarations: [
        FileBrowserComponent
    ],
    exports: [
        FileBrowserComponent
    ]
})
export class FileBrowserModule {

}
