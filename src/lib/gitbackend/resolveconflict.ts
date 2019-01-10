import { diff, applyChange} from 'deep-diff';

export enum ConflictPick {
    MINE,
    OLD,
    YOURS
}

export function getJSONConflictVersion(text, pick) {
    const originalText = getConflictVersion(text, 1);
    if(pick===1) {        
        return originalText;
    }
    
    const original = JSON.parse(originalText);
    const mine = JSON.parse(getConflictVersion(text, 0));
    const yours = JSON.parse(getConflictVersion(text, 2));

    const minePatch = diff(original, mine);
    const yourPatch = diff(original, yours);

    
    if(pick===0) {
        yourPatch.forEach(change => applyChange(original,null, change));
        minePatch.forEach(change => applyChange(original,null, change));
    } else if(pick === 2) {
        minePatch.forEach(change => applyChange(original,null, change));
        yourPatch.forEach(change => applyChange(original,null, change));
    }
    return JSON.stringify(original, null, 1);
}

export function getConflictVersion(text: string, pick: ConflictPick): string {
    while (hasConflicts(text)) {
        text = resolveNextConflict(text, pick);
    }
    return text;
}

export function hasConflicts(text: string) {
    const lines = text.split('\n');
    return lines.findIndex((l) => l.startsWith('<<<<<<<')) > -1;
}

export function resolveNextConflict(text: string, pick: ConflictPick) {
    const lines = text.split('\n');
    const conflictMineIndex = lines.findIndex((l) => l.startsWith('<<<<<<<'));
    const conflictOldIndex = lines.findIndex((l) => l.startsWith('|||||||'));
    const conflictYoursIndex = lines.findIndex((l) => l.startsWith('======='));
    const conflictEndIndex = lines.findIndex((l) => l.startsWith('>>>>>>>'));

    let chosen: string[];

    switch (pick) {
        case ConflictPick.MINE:
            chosen = lines.slice(conflictMineIndex + 1, conflictOldIndex);
            break;
        case ConflictPick.OLD:
            chosen = lines.slice(conflictOldIndex + 1, conflictYoursIndex);
            break;
        case ConflictPick.YOURS:
            chosen = lines.slice(conflictYoursIndex + 1, conflictEndIndex);
            break;
    }

    return lines.slice(0, conflictMineIndex)
        .concat(chosen)
        .concat(
            lines.slice(conflictEndIndex + 1, lines.length)
        ).join('\n');
}
