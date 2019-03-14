import { GitBackendService } from './gitbackend.service';
import { map, take } from 'rxjs/operators';
import { FileInfo } from '../filebrowser.module';
import { Observable } from 'rxjs';


describe('gitbackend service test', () => {
    let gitbackendservice: GitBackendService;
    beforeAll(async () => {
        gitbackendservice = new GitBackendService(null);
        gitbackendservice.syncLocalFSDisabled = true;
        
        await gitbackendservice.mount('testworkdir').toPromise();        
        await gitbackendservice.initRepository().toPromise();
        
        console.log('mount done and repository initialized', 
                    await (gitbackendservice.readdir('.') as Observable<String[]>).toPromise());
    });

    it('should read directory contents', async () => {
        await gitbackendservice.saveTextFile('test.txt', 'abcdefg').toPromise();

        console.log('text file saved');
        const dircontents = await (gitbackendservice
                                    .readdir() as Observable<FileInfo[]>)
                                    .toPromise() as  FileInfo[];

        console.log('dircontents', dircontents);

        expect(dircontents.find(f => f.name === 'test.txt')).toBeTruthy();
        console.log('readdir finished');
    });

    it('custom commit message', async () => {
        await gitbackendservice.saveTextFile('test2.txt', 'abcdefgh').toPromise();

        console.log('text file saved');
        await gitbackendservice.commitChanges('My custom commit message').toPromise();
        const log = await gitbackendservice.history().toPromise();
        console.log(log);
        expect(log[0].message).toBe('My custom commit message');
    });

    afterAll(() => {
        gitbackendservice.unmount();
    });
});
