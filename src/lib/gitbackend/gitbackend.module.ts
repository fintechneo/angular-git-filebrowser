import { NgModule } from '@angular/core';
import { GitBackendService } from './gitbackend.service';
import { FileBrowserService } from '../../lib/filebrowser.module';

@NgModule({

    providers: [{
        provide: FileBrowserService,
        useClass: GitBackendService
    }]

})
export class GitBackendModule {

}
