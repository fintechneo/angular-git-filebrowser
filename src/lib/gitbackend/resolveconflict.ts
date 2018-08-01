export enum ConflictPick {
    MINE,
    OLD,
    YOURS
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
