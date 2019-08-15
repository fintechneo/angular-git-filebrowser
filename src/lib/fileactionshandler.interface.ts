import { FileInfo } from './filebrowser.service';
import { Observable } from 'rxjs';

export interface FileActionsHandler {
    /**
     * Custom handler for editing files
     * @param fileInfo The file to edit
     * @returns true if default edit action should be run
     */
    editFile(fileInfo: FileInfo): boolean;
    /**
     * Custom handler for deleting files
     * @param fileInfo The file to delete
     * @returns true if default delete action should be run
     */
    deleteFile(fileInfo: FileInfo): boolean;
    /**
     * Custom handler for opening files
     * @param fileInfo The file to open
     * @returns true if default open action should be run
     */
    openFile(fileInfo: FileInfo): boolean;

    /**
     * custom logic for handling uploading of a file
     * will be invoked before every file upload
     * use e.g. to decide if LFS should be used
     * 
     * @returns observable of boolean which is true if upload should proceed, or false if it should be cancelled
     */
    beforeUpload(fileInfo: File): Observable<boolean>;
}
