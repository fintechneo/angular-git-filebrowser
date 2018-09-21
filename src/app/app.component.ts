import { Component, OnDestroy, ViewChild } from '@angular/core';

import { mergeMap, map } from 'rxjs/operators';
import { FileBrowserService } from '../lib/filebrowser.module';
import { GitBackendService } from '../lib/gitbackend/gitbackend.service';
import { HttpClient } from '@angular/common/http';
import { FileInfo } from '../lib/filebrowser.service';
import { FileActionsHandler } from '../lib/fileactionshandler.interface';
import { MatSnackBar, MatTableDataSource, MatPaginator } from '@angular/material';
import { FilesChangeEvent } from '../lib/fileschangeevent.class';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    {
      provide: FileBrowserService,
      useClass: GitBackendService,
      deps: [HttpClient]
    }
  ]
})
export class AppComponent implements OnDestroy {
  title = 'app';
  showfilebrowser = true;
  gitrepositoryurl = 'https://github.com/fintechneo/browsergittestdata.git';

  displayedLogColumns = ['when', 'name', 'email', 'message', 'id', 'parents'];
  workdir = 'workdir';
  gitbackendservice: GitBackendService;

  fullname = 'Test Person';
  email = 'test@example.com';

  log: MatTableDataSource<any>;
  @ViewChild(MatPaginator) logPaginator: MatPaginator;

  fileActionsHandler = new class implements FileActionsHandler {
    snackbar: MatSnackBar;

    editFile(fileInfo: FileInfo): boolean {
      if (fileInfo.name.endsWith('.mp3')) {
        this.snackbar.open('Unable to edit mp3 files', 'Dismiss');
        return false;
      } else {
        return true;
      }
    }

    deleteFile(fileInfo: FileInfo): boolean {
      return true;
    }

    openFile(fileInfo: FileInfo): boolean {
      return true;
    }
  };

  hideFileIfStartingWithDotFilter = (fileInfo: FileInfo): boolean => {
    return fileInfo.name.indexOf('.') === 0 ? false : true;
  }

  constructor(
    private filebrowserservice: FileBrowserService,
    public snackBar: MatSnackBar
  ) {
    this.fileActionsHandler.snackbar = snackBar;
    this.gitbackendservice = this.filebrowserservice as GitBackendService;
    this.gitbackendservice.mount(this.workdir).subscribe((ret) => {
      console.log('Local file sys ready', ret);
      if (ret) {
        this.gitbackendservice.setUser(this.fullname, this.email);
        this.refreshLog();
      } else {
        console.log('No git repo - clone or initialize');
      }
    });
  }

  clone() {
    this.gitbackendservice.clone(this.gitrepositoryurl)
      .pipe(
        mergeMap(() => this.gitbackendservice.readdir())
      )
      .subscribe();

  }

  updateGitUser() {
    this.gitbackendservice.setUser(this.fullname, this.email);
  }

  refreshLog() {
    (this.filebrowserservice as GitBackendService).history().subscribe(logdata => {
        this.log = new MatTableDataSource(logdata);
        this.log.paginator = this.logPaginator;
    });
  }

  pull() {
    this.gitbackendservice.commitChanges()
      .pipe(mergeMap(() => this.gitbackendservice.pull())).subscribe();

  }

  handleFilesChanges(event: FilesChangeEvent) {
    console.log(event);
  }

  push() {
    this.gitbackendservice.commitChanges()
      .pipe(mergeMap(() => this.gitbackendservice.push())).subscribe();
  }

  remount() {
    this.gitbackendservice.unmount();
    this.gitbackendservice.mount(this.workdir).subscribe(() => console.log('Local file sys ready'));
  }
  ngOnDestroy() {
    this.filebrowserservice.ngOnDestroy();
  }
}
