
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

export class FileInfo {
    name: string;
    mode: number;
    size: number;
    atime: string;
    mtime: string;
    ctime: string;
    isDir: boolean;
}

export abstract class FileBrowserService {
    fileList: BehaviorSubject<FileInfo[]> = new BehaviorSubject([]);

    abstract uploadFile(file: File): Observable<any>;
    abstract readdir(): Observable<FileInfo[]>;
    abstract unlink(filename: string): Observable<any>;
    abstract getDownloadObjectUrl(filename: string): Observable<string>;
}
