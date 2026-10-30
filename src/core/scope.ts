// Which notes the plugin looks after.

import { cleanFolder } from './note';
import type { Settings } from './settings';

/** Whether `path` is inside `folder`, matched as a whole folder name. */
function inFolder(path: string, folder: string): boolean {
	return path.startsWith(`${folder}/`);
}

/**
 * Whether this file is one the plugin looks after.
 *
 * The notes folder does two jobs: it is where new notes are made, and it is the
 * only place a mirror is ever written. That is what keeps the tag off notes
 * another plugin owns, such as a literature folder, where every note would
 * otherwise read as unfiled for ever because it answers no axis and never will.
 *
 * The template folder is never in scope, even inside the notes folder or with
 * the notes folder left empty. A template is not a note waiting to be filed,
 * and a tag written into one is copied into every note made from it.
 */
export function inScope(path: string, settings: Pick<Settings, 'notesFolder' | 'templateFolder'>): boolean {
	const templates = cleanFolder(settings.templateFolder);
	if (templates !== '' && inFolder(path, templates)) return false;
	const notes = cleanFolder(settings.notesFolder);
	return notes === '' || inFolder(path, notes);
}
