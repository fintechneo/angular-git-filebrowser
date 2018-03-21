
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class FileInfo {
    name: string;
    mode: number;
    size: number;
    atime: string;
    mtime: string;
    ctime: string;
    isDir: boolean;
}

export class FileBrowserService {
    fileList: BehaviorSubject<FileInfo[]> = new BehaviorSubject([]);
}
