// Keeping the one stored tag in line with what a note's own tags already say.
//
// Every write goes through `mirrorIsCurrent` first. Without that guard the
// metadata listener would see its own write, decide again, and write again.

import { TFile, type App } from 'obsidian';
import { mirrorIsCurrent, withMirror } from './core/filing';
import { cleanFolder } from './core/note';
import type { Settings } from './core/settings';
import { readTags } from './core/tags';
import { cachedTags, editFrontmatter } from './frontmatter';

/**
 * Whether this file is one the plugin looks after.
 *
 * The notes folder does two jobs: it is where new notes are made, and it is the
 * only place a mirror is ever written. That is what keeps the tag off notes
 * another plugin owns, such as a literature folder, where every note would
 * otherwise read as unfiled for ever because it answers no axis and never will.
 */
export function inScope(path: string, notesFolder: string): boolean {
	const folder = cleanFolder(notesFolder);
	if (folder === '') return true;
	return path.startsWith(`${folder}/`);
}

/** Whether the mirror is doing anything at all under these settings. */
export function mirrorActive(settings: Settings): boolean {
	return settings.unfiledTag !== '' && settings.axes.length > 0;
}

/**
 * Bring one note's mirror in line with its tags, writing only if it differs.
 *
 * The check is made twice: once off the metadata cache to avoid opening a file
 * that is already right, and once inside `processFrontMatter` against what is
 * actually on disk, because the cache can be a moment behind.
 */
export async function syncMirror(app: App, file: TFile, settings: Settings): Promise<boolean> {
	if (!mirrorActive(settings) || !inScope(file.path, settings.notesFolder)) return false;
	const cached = readTags(cachedTags(app, file));
	if (mirrorIsCurrent(settings.axes, cached, settings.unfiledTag)) return false;

	let wrote = false;
	await editFrontmatter(app, file, (frontmatter) => {
		const tags = readTags(frontmatter.tags);
		if (mirrorIsCurrent(settings.axes, tags, settings.unfiledTag)) return;
		const next = withMirror(settings.axes, tags, settings.unfiledTag);
		if (next.length === 0) delete frontmatter.tags;
		else frontmatter.tags = next;
		wrote = true;
	});
	return wrote;
}

/** Bring every note in scope in line. For after the vocabulary changes. */
export async function sweepMirror(app: App, settings: Settings): Promise<number> {
	if (!mirrorActive(settings)) return 0;
	let changed = 0;
	for (const file of app.vault.getMarkdownFiles()) {
		if (!inScope(file.path, settings.notesFolder)) continue;
		if (await syncMirror(app, file, settings)) changed += 1;
	}
	return changed;
}

/** The file the commands act on: the one in front of you, if it is in scope. */
export function activeNote(app: App, settings: Settings): TFile | null {
	const file = app.workspace.getActiveFile();
	if (!(file instanceof TFile) || file.extension !== 'md') return null;
	return inScope(file.path, settings.notesFolder) ? file : null;
}
