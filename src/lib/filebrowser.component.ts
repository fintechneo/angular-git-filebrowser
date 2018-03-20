/*
 *  Copyright 2010-2018 FinTech Neo AS ( fintechneo.com )- All rights reserved
 */

import { Input, ViewChild, Component, Renderer2, AfterViewInit, Inject, OnInit, HostListener } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import { ActivatedRoute } from '@angular/router';
import { mergeMap, map } from 'rxjs/operators';

@Component({
    selector: 'app-filebrowser',
    templateUrl: 'filebrowser.component.html'
})
export class FileBrowserComponent implements OnInit, AfterViewInit {
    organizationAbbreviation = '-';
    countryAlpha3Code = '-';
    dropText = 'Drop file here';

    @ViewChild('attachmentFileUploadInput') fileUploadInput: any;

    public showDropZone = false;
    public draggingOverDropZone = false;
    public uploadprogress: number = null;

    public hasImages = false;
    public fileList: any[] = [];

    public isAdminRole = false;

    constructor(
        private renderer: Renderer2,
        private snackbar: MatSnackBar,
        private dialog: MatDialog

    ) {


    }

    ngOnInit() {
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

    @HostListener('document:drop', ['$event'])
    public invalidDrop(event: DragEvent) {
        console.log('Drop outside valid drop target');
        event.preventDefault();
        this.draggingOverDropZone = false;
        this.showDropZone = false;
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


    public uploadFiles(files: File[]) {
        console.log('upload files', files);
    }



    public deleteFile(fileListItem: any) {

    }
}
