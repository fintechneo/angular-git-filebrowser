import { Component } from '@angular/core';

import { mergeMap, map } from 'rxjs/operators';
import { FileBrowserService } from '../lib/filebrowser.module';
import { GitBackendService } from '../lib/gitbackend/gitbackend.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  showfilebrowser = true;
  gitrepositoryurl = 'https://github.com/fintechneo/browsergittestdata.git';

  gitbackendservice: GitBackendService;

  constructor(
    private filebrowserservice: FileBrowserService
  ) {
    this.gitbackendservice = this.filebrowserservice as GitBackendService;
  }

  clone() {
    this.gitbackendservice.clone(this.gitrepositoryurl)
      .pipe(
        mergeMap(() => this.gitbackendservice.readdir())
      )
      .subscribe();

  }

  pull() {
      this.gitbackendservice.pull().subscribe();
  }

  push() {
    this.gitbackendservice.commitChanges()
      .pipe(mergeMap(() => this.gitbackendservice.push())).subscribe();
  }
}
