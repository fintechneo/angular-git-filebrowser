import { NgModule } from '@angular/core';
import { FileBrowserComponent } from './filebrowser.component';
import { MatGridListModule, MatListModule,
        MatToolbarModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule, MatSnackBarModule,
        MatDialogModule,
        MatButtonModule} from '@angular/material';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
export { FileBrowserService } from './filebrowser.service';
export { GitBackendModule } from './gitbackend/gitbackend.module';

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
