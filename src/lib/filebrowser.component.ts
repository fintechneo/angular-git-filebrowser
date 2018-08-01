/*
 *  Copyright 2010-2018 FinTech Neo AS ( fintechneo.com )- All rights reserved
 */

import { Input, ViewChild, Component, Renderer2, AfterViewInit, Inject, OnInit, HostListener, OnDestroy } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import { ActivatedRoute } from '@angular/router';
import { mergeMap, map, take, bufferCount, filter } from 'rxjs/operators';
import { from } from 'rxjs/observable/from';
import { FileBrowserService } from './filebrowser.service';
import { FileInfo } from './filebrowser.service';
import { SimpleTextEditorDialogComponent } from './simpletexteditordialog.component';
import { FileActionsHandler } from './fileactionshandler.interface';

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
    @ViewChild('attachmentFileUploadInput') fileUploadInput: any;

    public showDropZone = false;
    public draggingOverDropZone = false;
    public uploadprogress: number = null;

    renameFile: FileInfo;
    newFileName: string;
    fileList: Observable<FileInfo[]>;

    constructor(
        private renderer: Renderer2,
        private snackbar: MatSnackBar,
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
        this.filebrowserservice.rmdir(file.name).subscribe();
    }

    openFile(file: FileInfo) {
        if (!this.fileActionsHandler || this.fileActionsHandler.openFile(file)) {
            this.filebrowserservice.openFile(file);
        }
    }

    deleteFile(file: FileInfo) {
        if (!this.fileActionsHandler || this.fileActionsHandler.deleteFile(file)) {
            this.filebrowserservice.unlink(file.name).subscribe();
        }
    }

    public uploadFiles(files: FileList) {
        const numfiles = files.length;

        from(Array.from(files).map(file =>
            this.filebrowserservice.uploadFile(file)
        )).pipe(
            mergeMap(o =>
                o.pipe(
                  take(1)
                ), 1),
            bufferCount(numfiles),
            mergeMap(() => this.filebrowserservice.readdir())
        )
        .subscribe(() => console.log('Done uploading', numfiles));
    }

    createFolder() {
        this.filebrowserservice.mkdir('New folder').subscribe();
    }

    rename(file: FileInfo) {
        console.log('rename', this.newFileName);
        this.filebrowserservice.rename(file.name, this.newFileName).subscribe(() => {
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
                mergeMap((res) => this.filebrowserservice.saveTextFile(file.name, res))
            ).subscribe();
    }

    ngOnDestroy() {
        console.log('File browser component destroyed');
    }
}
