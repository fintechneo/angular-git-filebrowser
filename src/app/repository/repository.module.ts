import { NgModule } from '@angular/core';
import { MatSidenavModule, MatListModule,
    MatInputModule, MatCardModule, MatToolbarModule,
        MatIconModule, MatButtonModule, MatPaginatorModule, MatTableModule, MatCheckboxModule } from '@angular/material';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RepositoryComponent } from './repository.component';
import { RepositoryBrowserComponent } from './repositorybrowser.component';
import { LogComponent } from './log.component';
import { FileBrowserModule } from '../../lib/filebrowser.module';
import { LayoutHelperModule } from '../../lib/layout/layouthelper.module';
import { SelectRepositoryComponent } from './selectrepository.component';
import { SingleDirectoryViewComponent } from './singledirectoryview.component';
import { CredientialsService } from './credentials.service';
import { UploadUsingLFSDialogComponent } from './uploadusinglfsdialog.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        LayoutHelperModule,
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatCheckboxModule,
        MatTableModule,
        MatPaginatorModule,
        MatToolbarModule,
        FileBrowserModule,
        MatCardModule,
        RouterModule.forChild([
            {
                path: '',
                component: SelectRepositoryComponent
            },
            {
                path: ':repository',
                component: RepositoryComponent,
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'browse'
                    },
                    {
                        path: 'log',
                        component: LogComponent
                    },
                    {
                        path: 'singledirectoryview',
                        component: SingleDirectoryViewComponent
                    },
                    {
                        path: 'browse',
                        component: RepositoryBrowserComponent
                    }
                ]
            }])
    ],
    declarations: [
        SelectRepositoryComponent,
        SingleDirectoryViewComponent,
        RepositoryBrowserComponent,
        LogComponent,
        RepositoryComponent,
        UploadUsingLFSDialogComponent
    ],
    entryComponents: [
        UploadUsingLFSDialogComponent
    ],
    providers: [
        CredientialsService
    ]
})
export class RepositoryModule {

}
