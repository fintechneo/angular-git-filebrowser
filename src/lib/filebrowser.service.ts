
import { BehaviorSubject ,  Observable } from 'rxjs';
import { OnDestroy } from '@angular/core';

export class FileInfo {
    name: string;
    fullpath: string;
    mode: number;
    size: number;
    atime: string;
    mtime: string;
    ctime: string;
    isDir: boolean;
}

export abstract class FileBrowserService implements OnDestroy {

    fileList: BehaviorSubject<FileInfo[]> = new BehaviorSubject([]);
    currentpath: BehaviorSubject<string[]> = new BehaviorSubject([]);

    abstract listendir(dir: string): Observable<FileInfo[]>;
    abstract mount(dir: string): Observable<any>;
    abstract changedir(name: string): Observable<any>;
    abstract uploadFile(file: File): Observable<any>;
    abstract readdir(path?: string): Observable<string[]> | Observable<FileInfo[]>;
    abstract rmdir(dirname: string): Observable<any>;
    abstract unlink(filename: string): Observable<any>;
    abstract mkdir(foldername: string): Observable<any>;
    abstract rename(oldpath: string, newpath: string): Observable<any>;
    abstract getDownloadObjectUrl(filename: string): Observable<string>;
    abstract ngOnDestroy(): void;
    abstract getTextFileContents(filename: string): Observable<string>;
    abstract saveTextFile(filename: string, content: string): Observable<any>;

    public openFile(file: FileInfo) {
        this.getDownloadObjectUrl(file.fullpath ? file.fullpath : file.name)
            .subscribe((url: string) => {
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.style.display = 'none';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
    }
}
