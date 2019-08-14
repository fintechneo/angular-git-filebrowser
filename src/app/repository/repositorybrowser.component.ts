import { Component } from '@angular/core';
import { mergeMap, map, tap } from 'rxjs/operators';
import { MatSnackBar, MatDialog } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import { RepositoryService } from './repository.service';
import { FileActionsHandler } from '../../lib/fileactionshandler.interface';
import { FileBrowserService, FileInfo, GitBackendService } from '../../lib/filebrowser.module';
import { FilesChangeEvent } from '../../lib/fileschangeevent.class';
import { UploadUsingLFSDialogComponent } from './uploadusinglfsdialog.component';

@Component({
    templateUrl: 'repositorybrowser.component.html'
})
export class RepositoryBrowserComponent {

    fileActionsHandler: FileActionsHandler;
    gitbackendservice: GitBackendService;

    hideFileIfStartingWithDotFilter = (fileInfo: FileInfo): boolean => {
        return fileInfo.name.indexOf('.') === 0 ? false : true;
    }

    constructor(
        filebrowserservice: FileBrowserService,
        public snackBar: MatSnackBar,
        public route: ActivatedRoute,
        dialog: MatDialog,
        private repositoryservice: RepositoryService,
        http: HttpClient
    ) {
        this.gitbackendservice = filebrowserservice as GitBackendService;

        const gitbackendservice = this.gitbackendservice;

        this.fileActionsHandler = new class implements FileActionsHandler {

            editFile(fileInfo: FileInfo): boolean {
                return true;

            }

            deleteFile(fileInfo: FileInfo): boolean {
                return true;
            }

            openFile(fileInfo: FileInfo): boolean {
                const createAndInvokeLink = (url, filename) => {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                };


                filebrowserservice.getDownloadObjectUrl(fileInfo.name).pipe(
                    mergeMap(downloadurl => {
                        if (downloadurl.indexOf('http') === 0) {
                            return http.get(downloadurl, { responseType: 'blob' })
                                .pipe(
                                    map(blob =>
                                        URL.createObjectURL(blob))
                                );
                        } else {
                            return of(downloadurl);
                        }
                    })
                ).subscribe(url => createAndInvokeLink(url, fileInfo.name));

                return false;
            }

            beforeUpload(file: File): Observable<boolean> {
                
                if (file.type.startsWith('text/') || file.type === 'application/json') {
                    console.log('File is text type, not using LFS', file);
                    gitbackendservice.convertUploadsToLFSPointer = false;
                    return of(true);
                } else if (file.size < 1024 * 1024) {
                    console.log('File size is less than 1 MB', file);
                    return dialog.open(UploadUsingLFSDialogComponent, {data: file}).afterClosed()
                        .pipe(
                            tap(result =>
                                    gitbackendservice.convertUploadsToLFSPointer = result ? false : true),
                            mergeMap(() => of(true))
                        );
                } else {
                    gitbackendservice.convertUploadsToLFSPointer = true;
                    return of(true);
                }
            }
        };

    }

    handleFilesChanges(event: FilesChangeEvent) {
        console.log(event);
        this.repositoryservice.synchronizeChanges().subscribe();
    }
}
