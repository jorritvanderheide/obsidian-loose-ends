// Classifying a note, which is the second half of the loop.
//
// It asks only what is still missing, in the order the axes were configured, so
// filing a half-answered note is not filing it again from the start.

import { Notice, type TFile } from 'obsidian';
import type { Context } from '../context';
import { missingAxes } from '../core/filing';
import { byRecent, readRecent, rememberPick } from '../core/recent';
import { readTags, withValue } from '../core/tags';
import { cachedTags, editFrontmatter } from '../frontmatter';
import type { Axis } from '../core/vocabulary';
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

/** Ask for one axis, and write it. Returns false when the question was dismissed. */
async function answer(context: Context, file: TFile, axis: Axis): Promise<boolean> {
	const recent = readRecent(context.app.loadLocalStorage(recentKey(axis)));
	const picked = await choose(
		context.app,
		byRecent(axis.values, (value) => value, recent).map((value) => ({ value, label: value })),
		`Which ${axis.namespace}?`,
	);
	if (picked === null) return false;
	context.app.saveLocalStorage(recentKey(axis), rememberPick(recent, picked, axis.values));
	await editFrontmatter(context.app, file, (frontmatter) => {
		frontmatter.tags = withValue(readTags(frontmatter.tags), axis.namespace, picked);
	});
	return true;
}

export async function fileNote(context: Context): Promise<void> {
	if (context.settings.axes.length === 0) {
		new Notice('Loose Ends has no axes yet. Add one in its settings to say what a note is filed by.');
		return;
	}
	const file = activeNote(context.app, context.settings);
	if (file === null) {
		new Notice('Loose Ends only files notes in its notes folder.');
		return;
	}

	const tags = readTags(cachedTags(context.app, file));
	const missing = missingAxes(context.settings.axes, tags);
	if (missing.length === 0) {
		new Notice('Already filed.');
		return;
	}

	// Stopping on a dismissed question keeps what was already answered: half an
	// answer is still progress, and re-asking it would be the annoying half.
	for (const axis of missing) {
		if (!(await answer(context, file, axis))) break;
	}
	await syncMirror(context.app, file, context.settings);

	const left = missingAxes(
		context.settings.axes,
		readTags(cachedTags(context.app, file)),
	);
	if (left.length === 0 && mirrorActive(context.settings)) new Notice('Filed.');
}

/** Change one axis on the open note, whether or not it was already answered. */
export async function setAxis(context: Context, axis: Axis): Promise<void> {
	const file = activeNote(context.app, context.settings);
	if (file === null) {
		new Notice('Loose Ends only files notes in its notes folder.');
		return;
	}
	if (await answer(context, file, axis)) await syncMirror(context.app, file, context.settings);
}
