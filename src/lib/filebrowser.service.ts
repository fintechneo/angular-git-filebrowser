
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class FileBrowserService {
    fileList: BehaviorSubject<string[]> = new BehaviorSubject(['']);
}
