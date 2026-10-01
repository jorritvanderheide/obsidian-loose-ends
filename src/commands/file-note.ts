// Classifying a note, which is the second half of the loop.
//
// It asks only what is still missing, in the order the axes were configured, so
// filing a half-answered note is not filing it again from the start.

import { Notice, type TFile } from 'obsidian';
import type { Context } from '../context';
import { missingAxes } from '../core/filing';
import { activeAxes } from '../core/settings';
import { byRecent, readRecent, rememberPick } from '../core/recent';
import { readTags, withValue } from '../core/tags';
import { cachedTags, editFrontmatter } from '../frontmatter';
import { questionFor, type Axis } from '../core/vocabulary';
import { activeNote, mirrorActive, syncMirror } from '../mirror';
import { choose } from '../ui/choose';

/**
 * Where the order an axis's values were last picked in is kept: this vault,
 * this device, one list per axis. A habit rather than a setting, like the
 * template order.
 */
function recentKey(axis: Axis): string {
	return `loose-ends-recent-axis-${axis.namespace}`;
}

/**
 * Ask for one axis, and write it. Returns false when the question was dismissed.
 *
 * The question names the note when it is not the one open, because filing from
 * the inbox block asks about a note you cannot see, and a mis-click would
 * otherwise file the wrong one without a sign.
 */
async function answer(context: Context, file: TFile, axis: Axis): Promise<boolean> {
	const question = questionFor(axis, readTags(cachedTags(context.app, file)));
	const recent = readRecent(context.app.loadLocalStorage(recentKey(axis)));
	const picked = await choose(
		context.app,
		byRecent(axis.values, (value) => value, recent).map((value) => ({ value, label: value })),
		context.app.workspace.getActiveFile() === file ? question : `${file.basename} · ${question}`,
	);
	if (picked === null) return false;
	context.app.saveLocalStorage(recentKey(axis), rememberPick(recent, picked, axis.values));
	await editFrontmatter(context.app, file, (frontmatter) => {
		frontmatter.tags = withValue(readTags(frontmatter.tags), axis.namespace, picked);
	});
	return true;
}

/** File a note: the one given, or the one open. */
export async function fileNote(context: Context, target?: TFile): Promise<void> {
	if (activeAxes(context.settings).length === 0) {
		new Notice('Loose Ends has no axes yet. Add one in its settings to say what every note needs.');
		return;
	}
	const file = target ?? activeNote(context.app, context.settings);
	if (file === null) {
		new Notice('Loose Ends only files notes in its notes folder.');
		return;
	}

	const tags = readTags(cachedTags(context.app, file));
	const missing = missingAxes(activeAxes(context.settings), tags);
	if (missing.length === 0) {
		new Notice('This note is already filed.');
		return;
	}

	// Stopping on a dismissed question keeps what was already answered: half an
	// answer is still progress, and re-asking it would be the annoying half.
	for (const axis of missing) {
		if (!(await answer(context, file, axis))) break;
	}
	await syncMirror(context.app, file, context.settings);

	const left = missingAxes(
		activeAxes(context.settings),
		readTags(cachedTags(context.app, file)),
	);
	if (left.length === 0 && mirrorActive(context.settings)) new Notice('Filed.');
}

/** Change one axis on a note, the one given or the one open, whether or not it was already answered. */
export async function setAxis(context: Context, axis: Axis, target?: TFile): Promise<void> {
	const file = target ?? activeNote(context.app, context.settings);
	if (file === null) {
		new Notice('Loose Ends only files notes in its notes folder.');
		return;
	}
	if (await answer(context, file, axis)) await syncMirror(context.app, file, context.settings);
}
