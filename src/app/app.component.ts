import { Component, OnDestroy } from '@angular/core';

import { mergeMap, map } from 'rxjs/operators';
import { FileBrowserService } from '../lib/filebrowser.module';
import { GitBackendService } from '../lib/gitbackend/gitbackend.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: FileBrowserService,
      useClass: GitBackendService
  }
  ]
})
export class AppComponent implements OnDestroy {
  title = 'app';
  showfilebrowser = true;
  gitrepositoryurl = 'https://github.com/fintechneo/browsergittestdata.git';

  gitbackendservice: GitBackendService;

  constructor(
    private filebrowserservice: FileBrowserService
  ) {
    this.gitbackendservice = this.filebrowserservice as GitBackendService;
    this.gitbackendservice.mount('workdir').subscribe(() => console.log('Local file sys ready'));
  }

  clone() {
    this.gitbackendservice.clone(this.gitrepositoryurl)
      .pipe(
        mergeMap(() => this.gitbackendservice.readdir())
      )
      .subscribe();

  }

  pull() {
    this.gitbackendservice.commitChanges()
      .pipe(mergeMap(() => this.gitbackendservice.pull())).subscribe();

  }

  push() {
    this.gitbackendservice.commitChanges()
      .pipe(mergeMap(() => this.gitbackendservice.push())).subscribe();
  }

  ngOnDestroy() {
    this.filebrowserservice.ngOnDestroy();
  }
}
