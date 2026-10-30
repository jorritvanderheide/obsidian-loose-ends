// Classifying a note, which is the second half of the loop.
//
// It asks only what is still missing, in the order the axes were configured, so
// filing a half-answered note is not filing it again from the start.

import { Notice, type TFile } from 'obsidian';
import type { Context } from '../context';
import { missingAxes } from '../core/filing';
import { activeAxes } from '../core/settings';
import { byRecent, readRecent, rememberPick } from '../core/recent';
import { canRewriteTags, readTags, withValue } from '../core/tags';
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

/** Said instead of writing, when an answer would cost an entry in the tags property. */
const UNREADABLE_TAGS =
	"Loose Ends didn't change this note's tags, because its tags property holds something that isn't a tag, like a nested list. Make every entry in it a plain tag, then try again.";

/**
 * Ask for one axis, and write it. Returns false when the question was
 * dismissed, or when the tags property holds something writing it would lose.
 *
 * The question names the note when it is not the one open, because filing from
 * the inbox block asks about a note you cannot see, and a mis-click would
 * otherwise file the wrong one without a sign.
 */
async function answer(context: Context, file: TFile, axis: Axis): Promise<boolean> {
	if (!canRewriteTags(cachedTags(context.app, file))) {
		new Notice(UNREADABLE_TAGS);
		return false;
	}
	const question = questionFor(axis, readTags(cachedTags(context.app, file)));
	const recent = readRecent(context.app.loadLocalStorage(recentKey(axis)));
	const picked = await choose(
		context.app,
		byRecent(axis.values, (value) => value, recent).map((value) => ({ value, label: value })),
		context.app.workspace.getActiveFile() === file ? question : `${file.basename} · ${question}`,
	);
	if (picked === null) return false;
	context.app.saveLocalStorage(recentKey(axis), rememberPick(recent, picked, axis.values));
	// Checked again against the file, which the cache can be a moment behind.
	let written = false;
	await editFrontmatter(context.app, file, (frontmatter) => {
		if (!canRewriteTags(frontmatter.tags)) return;
		frontmatter.tags = withValue(readTags(frontmatter.tags), axis.namespace, picked);
		written = true;
	});
	if (!written) new Notice(UNREADABLE_TAGS);
	return written;
}

/**
 * Why there is no note to act on. `activeNote` is null both when no note is
 * open and when the open one is outside the notes folder, and each wants its
 * own advice.
 */
function noNoteNotice(context: Context): void {
	const open = context.app.workspace.getActiveFile();
	new Notice(
		open?.extension === 'md'
			? 'This note is outside your notes folder, and Loose Ends only files notes inside it. Move it in, or change Settings → Loose Ends → Notes folder.'
			: "There's no note open to file. Open a note in your notes folder, then try again.",
	);
}

/** File a note: the one given, or the one open. */
export async function fileNote(context: Context, target?: TFile): Promise<void> {
	if (activeAxes(context.settings).length === 0) {
		new Notice('Loose Ends has no axes yet. Add one in its settings to say what every note needs.');
		return;
	}
	const file = target ?? activeNote(context.app, context.settings);
	if (file === null) {
		noNoteNotice(context);
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
		noNoteNotice(context);
		return;
	}
	if (await answer(context, file, axis)) await syncMirror(context.app, file, context.settings);
}
