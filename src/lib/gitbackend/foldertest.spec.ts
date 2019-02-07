import { GitBackendService } from './gitbackend.service';
import { map, take } from 'rxjs/operators';


describe('FolderOp', () => {
    let gitbackendservice: GitBackendService;
    beforeAll(async () => {
        gitbackendservice = new GitBackendService(null);
        gitbackendservice.syncLocalFSDisabled = true;
        await gitbackendservice.mount('testworkdir')
            .pipe(take(1))
            .toPromise();
        console.log('mount done');
    });


    it('create a folder and file. then delete folder ', async () => {

        await gitbackendservice.mkdir('xyz').pipe(take(1)).toPromise();
        await gitbackendservice.changedir('xyz').pipe(take(1)).toPromise();
        await gitbackendservice.saveTextFile('test.txt', 'abcdefg').pipe(take(1)).toPromise();
        await gitbackendservice.saveTextFile('.hidden', 'abcdefg').pipe(take(1)).toPromise();

        const dircontents1 = await gitbackendservice.readdir()
            .pipe(
                map(
                    list => list.filter(d => d.fullpath === '/testworkdir/xyz/test.txt')
                ),
                take(1)
            ).toPromise();

        expect(dircontents1.length).toBe(1);
        console.log('rmdir finished');

        await gitbackendservice.changedir('..').pipe(take(1)).toPromise()
        
        await gitbackendservice.rmdir('xyz').pipe(take(1)).toPromise();

        const dircontents2 = await gitbackendservice.readdir()
            .pipe(
                take(1)
            ).toPromise();


        expect(dircontents2.filter(d => d.fullpath === '/testworkdir/xyz/test.txt').length).toBe(0);
        expect(dircontents2.filter(d => d.fullpath === '/testworkdir/xyz').length).toBe(0);
        console.log('rmdir finished');

    });



    afterAll(() => {
        gitbackendservice.unmount();
    });
});
