import { GitBackendService } from './gitbackend.service';
import { map, take } from 'rxjs/operators';


describe('Readdirtest', () => {
    let gitbackendservice: GitBackendService;
    beforeAll(async () => {
        gitbackendservice = new GitBackendService(null);
        gitbackendservice.syncLocalFSDisabled = true;
        await gitbackendservice.mount('testworkdir')
            .pipe(take(1))
            .toPromise();
        console.log('mount done');
    });

    it('should read directory contents', async () => {
        await gitbackendservice.saveTextFile('test.txt', 'abcdefg').toPromise();

        console.log('text file saved');
        const dircontents = await gitbackendservice.readdir()
            .pipe(
                map(
                    dirContents => dirContents.filter(d => d.name.indexOf('.') !== 0)
                ),
                take(1)
            ).toPromise();

        console.log('dircontents', dircontents);

        expect(dircontents.length).toBe(1);
        expect(dircontents[0].name).toBe('test.txt');
        console.log('readdir finished');

    });

    afterAll(() => {
        gitbackendservice.unmount();
    });
});
