import { ConflictPick, resolveNextConflict, hasConflicts, getConflictVersion, getJSONConflictVersion } from './resolveconflict';

const conflictJSONstring = `{
"id": null,
<<<<<<< HEAD
"title": "Test test 7060",
"locationName": "changed location",
||||||| Revision 2018-04-19T08:44:52.192Z
"title": "Test test 7060",
"locationName": "wwewe derefetet",
=======
"title": "Test test 7060 - changed title",
"locationName": "wwewe derefetet",
>>>>>>> cf013e36b187014d6d7f4c94ea93b323d81767c6
"status": null,
"startDate": "2018-04-19T23:00:00.000Z",
"endDate": "2018-04-20T03:00:00.000Z"
}`;

describe('ResolveGitConflictTest', () => {
    it('should resolve conflict', () => {
        console.log('Testing resolving diff3 conflicts');
        const minestring = resolveNextConflict(conflictJSONstring, ConflictPick.MINE);
        const oldstring = resolveNextConflict(conflictJSONstring, ConflictPick.OLD);
        const yoursstring = resolveNextConflict(conflictJSONstring, ConflictPick.YOURS);

        const mine = JSON.parse(minestring);
        const old = JSON.parse(oldstring);
        const yours = JSON.parse(yoursstring);

        expect(
            mine.title
        ).toEqual('Test test 7060');
        expect(
            mine.locationName
        ).toEqual('changed location');

        expect(
            old.locationName
        ).toEqual('wwewe derefetet');
        expect(
            old.title
        ).toEqual(mine.title);

        expect(yours.title).toEqual('Test test 7060 - changed title');
        expect(
            old.locationName
        ).toEqual(yours.locationName);

        expect(hasConflicts(minestring)).toBeFalsy();
        expect(hasConflicts(oldstring)).toBeFalsy();
        expect(hasConflicts(yoursstring)).toBeFalsy();
    });

    it('should resolve JSON conflict', () => {
        console.log('Testing resolving diff3 conflicts with JSON merger');
        
        const mine = JSON.parse(getJSONConflictVersion(conflictJSONstring, ConflictPick.MINE));
        const old = JSON.parse(getJSONConflictVersion(conflictJSONstring, ConflictPick.OLD));
        const yours = JSON.parse(getJSONConflictVersion(conflictJSONstring, ConflictPick.YOURS));

        expect(
            mine.title
        ).toEqual('Test test 7060 - changed title');
        expect(
            mine.locationName
        ).toEqual('changed location');

        expect(
            yours.title
        ).toEqual('Test test 7060 - changed title');
        expect(
            yours.locationName
        ).toEqual('changed location');

        expect(
            old.locationName
        ).toEqual('wwewe derefetet');
        expect(
            old.title
        ).toEqual('Test test 7060');        
    });
});
