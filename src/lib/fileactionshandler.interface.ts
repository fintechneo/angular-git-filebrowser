import { FileInfo } from './filebrowser.service';

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
}
