/*
 *  Copyright 2010-2018 FinTech Neo AS ( fintechneo.com )- All rights reserved
 */

import { Input, ViewChild, Component, AfterViewInit,
    OnInit, HostListener, OnDestroy, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Observable ,  from, of } from 'rxjs';

import { mergeMap, map, take, bufferCount, filter, tap } from 'rxjs/operators';
import { FileBrowserService } from './filebrowser.service';
import { FileInfo } from './filebrowser.service';
import { SimpleTextEditorDialogComponent } from './simpletexteditordialog.component';
import { FileActionsHandler } from './fileactionshandler.interface';
import { FilesChangeEvent, FileChangeEventType } from './fileschangeevent.class';

@Component({
    selector: 'app-filebrowser',
    templateUrl: 'filebrowser.component.html',
    styleUrls: [
        'filebrowser.component.css'
    ]
})
export class FileBrowserComponent implements OnInit, AfterViewInit, OnDestroy {
    dropText = 'Drop file here';

    @Input() fileInfoFilter: (fileInfo: FileInfo) => boolean;
    @Input() fileActionsHandler: FileActionsHandler;
    @Output() fileschanges = new EventEmitter<FilesChangeEvent>();
    @ViewChild('attachmentFileUploadInput') fileUploadInput: any;

    public showDropZone = false;
    public draggingOverDropZone = false;
    public uploadprogress: number = null;

    renameFile: FileInfo;
    newFileName: string;
    fileList: Observable<FileInfo[]>;

    constructor(
        private dialog: MatDialog,
        public filebrowserservice: FileBrowserService
    ) {
        this.fileList = filebrowserservice.fileList;

    }

    ngOnInit() {
        if (this.fileInfoFilter) {
            this.fileList = this.fileList.pipe(
                map((fileList) =>
                    fileList.filter(fileInfo => this.fileInfoFilter(fileInfo))
                        .sort((a, b) =>
                            ((a.isDir ? 'A' : 'B') + a.name).toLocaleLowerCase().localeCompare(
                                    ((b.isDir ? 'A' : 'B') + b.name).toLocaleLowerCase()
                                )
                            )
                )
            );
        }
    }

    ngAfterViewInit() {

    }

    public listExistingFiles() {

    }

    @HostListener('document:dragover', ['$event'])
    public dragging(event: DragEvent) {
        const dt = event.dataTransfer;

        if (dt.types) {
            let foundFilesType = false;
            for (let n = 0; n < dt.types.length; n++) {
                if (dt.types[n] === 'Files' || dt.types[n] === 'application/x-moz-file') {
                    foundFilesType = true;
                    break;
                }
            }

            if (foundFilesType) {
                event.preventDefault();
                this.showDropZone = true;
            }
        }
    }

    @HostListener('document:dragleave', ['$event'])
    public dragLeave(event: DragEvent) {
        this.draggingOverDropZone = false;
        this.showDropZone = false;
    }

    @HostListener('document:drop', ['$event'])
    public invalidDrop(event: DragEvent) {
        console.log('Drop outside valid drop target');
        event.preventDefault();
        this.hideDropZone();
    }


    public hideDropZone() {
        this.draggingOverDropZone = false;
        this.showDropZone = false;
    }

    public dropFiles(event: any) {
        event.preventDefault();
        this.uploadFiles(event.dataTransfer.files);
        this.hideDropZone();
    }

    public onFilesSelected(event) {
        this.uploadFiles(event.target.files);
    }

    public attachFilesClicked() {
        this.fileUploadInput.nativeElement.click();
    }

    deleteDir(file: FileInfo) {
        this.filebrowserservice.rmdir(file.name).subscribe(() =>
            this.fileschanges.emit(new FilesChangeEvent(FileChangeEventType.RM_DIR, [file]))
        );
    }

    openFile(file: FileInfo) {
        if (!this.fileActionsHandler || this.fileActionsHandler.openFile(file)) {
            this.filebrowserservice.openFile(file);
        }
    }

    deleteFile(file: FileInfo) {
        if (!this.fileActionsHandler || this.fileActionsHandler.deleteFile(file)) {
            this.filebrowserservice.unlink(file.name).subscribe(() =>
                this.fileschanges.emit(new FilesChangeEvent(FileChangeEventType.RM_FILE, [file]))
            );
        }
    }

    public uploadFiles(files: FileList) {
        const numfiles = files.length;

        from(Array.from(files).map(file => 
            this.fileActionsHandler ? this.fileActionsHandler.beforeUpload(file)
                .pipe(
                    mergeMap((proceed) =>
                        proceed ? this.filebrowserservice.uploadFile(file) : of(false)
                )
            ) : this.filebrowserservice.uploadFile(file)
        )).pipe(
            mergeMap(o =>
                o.pipe(
                  take(1)
                ), 1),
            bufferCount(numfiles),
            mergeMap(() => this.filebrowserservice.readdir())
        )
        .subscribe(() =>
            this.fileschanges.emit(
            new FilesChangeEvent(FileChangeEventType.SAVE_FILE,
            Array.from(files)))
        );
    }

    createFolder() {
        const foldername = 'New folder';
        this.filebrowserservice.mkdir(foldername).subscribe(() =>
            this.fileschanges.emit(
                new FilesChangeEvent(FileChangeEventType.MK_DIR,
                    foldername)
            )
        );
    }

    rename(file: FileInfo) {
        console.log('rename', this.newFileName);
        this.filebrowserservice.rename(file.name, this.newFileName).subscribe(() => {
            this.fileschanges.emit(
                new FilesChangeEvent(FileChangeEventType.RENAME,
                    [file, this.newFileName])
            );
            this.newFileName = null;
            this.renameFile = null;
        });
    }

    changedir(file: FileInfo) {
        this.filebrowserservice.changedir(file.name).subscribe();
    }

    /**
     *
     * @param indexfromcurrentpatharray (-1 = workdir root, otherwise 0 is first folder in current path array)
     */
    goToParent(indexfromcurrentpatharray: number) {
        this.filebrowserservice.currentpath
            .pipe(
                take(1),
                filter(p => p.length > indexfromcurrentpatharray + 1),
                mergeMap(p =>
                    this.filebrowserservice.changedir(
                        new Array(p.length - 1 - indexfromcurrentpatharray)
                        .fill('..')
                        .join('/')
                    )
                )
            )
            .subscribe();
    }

    editFile(file: FileInfo) {
        if (!this.fileActionsHandler || this.fileActionsHandler.editFile(file)) {
            this.openTextEditor(file);
        }
    }

    openTextEditor(file: FileInfo) {
        this.filebrowserservice.getTextFileContents(file.name)
            .pipe(
                mergeMap((contents) =>
                    this.dialog.open(SimpleTextEditorDialogComponent,
                        {data: {contents: contents}})
                        .afterClosed()
                ),
                filter(res => res ? true : false),
		mergeMap((res) => this.filebrowserservice.saveTextFile(file.name, res)),
		tap(() => this.fileschanges.emit(
                	new FilesChangeEvent(FileChangeEventType.SAVE_FILE,
	                    [file, this.newFileName]))
   	    	)
        ).subscribe();
    }

    ngOnDestroy() {
        console.log('File browser component destroyed');
    }
}
