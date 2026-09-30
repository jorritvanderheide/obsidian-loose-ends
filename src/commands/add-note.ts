// Making a note without classifying it, which is the first half of the loop.
//
// Nothing is asked here but a name and a shape. A template may carry the tags
// it is certain of, and whatever is still unanswered is what the mirror reports.

import { MarkdownView, Notice, TFile, normalizePath } from 'obsidian';
import type { Context } from '../context';
import { cleanFolder, notePath } from '../core/note';
import { withoutPrompts } from '../core/prompts';
import { byRecent, readRecent, rememberPick } from '../core/recent';
import { fillTemplate, placeCursor, STARTER_TEMPLATE, templateName } from '../core/template';
import { syncMirror } from '../mirror';
import { templateFiles } from '../templates';
import type { Choice as OfferOf } from '../ui/choose';
import { promptForNote } from '../ui/prompt';

/**
 * What the template question can answer.
 *
 * A shape rather than `TFile | null`, because the picker already says "nothing
 * chosen" with null and "no template" has to be distinguishable from "changed
 * my mind". The two meant the same thing for one revision of this file, and an
 * escaped picker silently made an empty note.
 */
type Choice = { kind: 'none' } | { kind: 'template'; file: TFile };

type Offer = OfferOf<Choice>;

/**
 * Where the order templates were last picked in is kept: this vault, this
 * device. It is a habit rather than a setting, so it stays out of the settings.
 */
const RECENT_KEY = 'loose-ends-recent-templates';

/** A choice as the history knows it. No path is empty, so no template cannot collide with one. */
function choiceKey(choice: Choice): string {
	return choice.kind === 'none' ? '' : choice.file.path;
}

async function ensureFolder(context: Context, folder: string): Promise<void> {
	if (folder === '') return;
	const path = normalizePath(folder);
	if (context.app.vault.getAbstractFileByPath(path) === null) {
		await context.app.vault.createFolder(path);
	}
}

/**
 * Write the template Loose Ends ships with into the template folder.
 *
 * Only on a fresh install, and never over a file already there. Deleting it
 * afterwards is an answer, so it is not written again.
 */
export async function writeStarterTemplate(context: Context): Promise<void> {
	const folder = cleanFolder(context.settings.templateFolder);
	if (folder === '') return;
	const path = notePath(folder, STARTER_TEMPLATE.name);
	if (context.app.vault.getAbstractFileByPath(path) !== null) return;
	await ensureFolder(context, folder);
	await context.app.vault.create(path, STARTER_TEMPLATE.text);
}

export async function addNote(context: Context): Promise<void> {
	const folder = cleanFolder(context.settings.notesFolder);
	const exists = (path: string) => context.app.vault.getAbstractFileByPath(path) !== null;

	const recent = readRecent(context.app.loadLocalStorage(RECENT_KEY));
	const templates: Offer[] = templateFiles(context.app, context.settings.templateFolder).map((file) => ({
		value: { kind: 'template', file },
		label: templateName(file.path),
	}));
	// An empty note only when there is no template to offer, or the prompt
	// would have nothing to pick and no note could be made at all.
	const choices = byRecent(
		templates.length > 0 ? templates : [{ value: { kind: 'none' }, label: 'No template', description: 'An empty note' }],
		(choice) => choiceKey(choice.value),
		recent,
	);

	// Dismissing the prompt cancels the note. Nothing has been written yet, so
	// there is nothing to be half-done.
	const picked = await promptForNote(context.app, folder, exists, choices);
	if (picked === null) return;
	context.app.saveLocalStorage(
		RECENT_KEY,
		rememberPick(recent, choiceKey(picked.value), choices.map((choice) => choiceKey(choice.value))),
	);

	try {
		// A template's prompts are drawn in the note, not copied into it: see
		// `core/prompts.ts`.
		const { text, fromEnd } = placeCursor(
			picked.value.kind === 'template'
				? fillTemplate(withoutPrompts(await context.app.vault.cachedRead(picked.value.file)), picked.title)
				: '',
		);
		await ensureFolder(context, folder);
		const file = await context.app.vault.create(notePath(folder, picked.title), text);
		await syncMirror(context.app, file, context.settings);
		const leaf = context.app.workspace.getLeaf(false);
		await leaf.openFile(file);
		if (fromEnd !== null && leaf.view instanceof MarkdownView) {
			const editor = leaf.view.editor;
			editor.setCursor(editor.offsetToPos(editor.getValue().length - fromEnd));
			editor.focus();
		}
	} catch (error) {
		new Notice(`Loose Ends could not make that note: ${error instanceof Error ? error.message : String(error)}`);
	}
}
