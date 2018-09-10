import { FileInfo } from './filebrowser.service';

export enum FileChangeEventType {
    RM_DIR,
    RM_FILE,
    SAVE_FILE,
    MK_DIR,
    RENAME
}

export class FilesChangeEvent {
    constructor(
        public action: FileChangeEventType,
        public items: any
    ) {

    }
}
