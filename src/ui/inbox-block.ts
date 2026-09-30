// The ```loose-ends``` block: the inbox, on a note of your own.
//
// Drawn in Obsidian's own nav markup, the way Paper Trail draws its reading
// list, so the two blocks look alike and both look like the file explorer in
// whatever theme is installed. Which notes appear, and in what order, is
// decided in `core/inbox.ts`.

import { MarkdownRenderChild, MarkdownView, Menu, debounce, moment, setIcon, type App, type TFile } from 'obsidian';
import { fileNote } from '../commands/file-note';
import type { Context } from '../context';
import { INBOX_ROWS, inboxLabel, owedLabel, recentlyFiled, unfiledNotes, type InboxNote } from '../core/inbox';
import { activeAxes } from '../core/settings';
import { inboxNotes, loadFilings, onInboxChange } from '../inbox';
import { inScope } from '../mirror';
import { addFilingItems } from './note-menu';

export const INBOX_BLOCK = 'loose-ends';

/**
 * Whether the inbox shows every note and whether Recently filed is open, for
 * as long as Obsidian is. Shared by every block, so switching a note between
 * reading and editing, which draws the block again, keeps them as they were.
 */
let expanded = false;
let openFiled = false;

export class InboxBlock extends MarkdownRenderChild {
	constructor(
		containerEl: HTMLElement,
		private readonly context: Context,
		/** The note holding the block, which is left out of its own list. */
		private readonly host: string,
	) {
		super(containerEl);
	}

	/** Coalesced, because a sync or a git pull changes notes by the dozen. */
	private readonly redraw = debounce(() => this.draw(), 200, true);

	onload(): void {
		const app = this.context.app;
		this.draw();
		// Filing a note from a row takes it out of the list without a refresh.
		// Only a note the block could list, so typing elsewhere, in the note
		// holding the block included, does not redraw it on every pause.
		const listed = (path: string) => {
			if (inScope(path, this.context.settings.notesFolder)) this.redraw();
		};
		this.registerEvent(app.metadataCache.on('changed', (file) => listed(file.path)));
		this.registerEvent(app.vault.on('create', (file) => listed(file.path)));
		this.registerEvent(app.vault.on('delete', (file) => listed(file.path)));
		this.registerEvent(
			app.vault.on('rename', (file, old) => {
				listed(file.path);
				listed(old);
			}),
		);
		this.registerEvent(onInboxChange(app, this.redraw));
		// Drawn before the cache is ready, every note would read as unfiled.
		if (!app.workspace.layoutReady) app.workspace.onLayoutReady(this.redraw);
		// Moving the highlight is a class on one row, not a redraw.
		this.registerEvent(app.workspace.on('file-open', () => highlight(this.containerEl, app)));
	}

	onunload(): void {
		this.redraw.cancel();
	}

	private draw(): void {
		renderInbox(this.containerEl, this.context, this.host);
	}
}

function renderInbox(root: HTMLElement, context: Context, host: string): void {
	const { app, settings } = context;
	const redraw = () => renderInbox(root, context, host);
	root.empty();
	root.addClass('loose-ends-inbox');
	const tree = root.createDiv({ cls: 'nav-files-container loose-ends-tree' });

	const axes = activeAxes(settings);
	if (axes.length === 0) {
		tree.createDiv({
			cls: 'pane-empty',
			text: 'No axes yet, so every note counts as filed. Add one in the Loose Ends settings.',
		});
		return;
	}

	const notes = inboxNotes(app, settings).filter((note) => note.path !== host);
	const unfiled = unfiledNotes(notes, axes);
	const filed = recentlyFiled(notes, axes, loadFilings(app), Date.now());

	// Always open. It is what the block is for, and a fold would only hide it.
	const inbox = folder(tree, {
		label: inboxLabel(settings.unfiledTag),
		icon: 'inbox',
		hint: 'Notes still missing an answer.',
		count: unfiled.length,
		open: true,
	});
	if (inbox) {
		// Never "and 1 more": that line is a row's height, so it would cost what
		// showing the note costs and say less.
		const shown = expanded || unfiled.length <= INBOX_ROWS + 1 ? unfiled.length : INBOX_ROWS;
		for (const { note, missing } of unfiled.slice(0, shown)) {
			const row = noteRow(inbox, context, note, owedLabel(missing));
			if (!row) continue;
			const file = row.file;
			const actions = row.el.createDiv({ cls: 'loose-ends-actions' });
			iconButton(actions, 'tag', 'File note', () => void fileNote(context, file));
		}
		if (unfiled.length > shown) {
			treeRow(inbox, `and ${unfiled.length - shown} more`, () => {
				expanded = true;
				redraw();
			}).addClass('loose-ends-more');
		}
	}

	// Shut by default: what is done asks nothing of you, and open it would take
	// rows from the notes that do.
	const recent = folder(tree, {
		label: 'Recently filed',
		icon: 'archive',
		hint: 'Notes filed in the last 7 days, on this device.',
		count: filed.length,
		open: openFiled,
		toggle: () => {
			openFiled = !openFiled;
			redraw();
		},
		cls: 'loose-ends-recent',
	});
	if (recent) {
		for (const { note, at } of filed) noteRow(recent, context, note, `Filed ${moment(at).fromNow()}`);
	}

	highlight(root, app);
}

/** A note's row: opens it on click, and offers filing on right-click. */
function noteRow(
	parent: HTMLElement,
	context: Context,
	note: InboxNote,
	tooltip: string,
): { el: HTMLElement; file: TFile } | null {
	const file = context.app.vault.getFileByPath(note.path);
	if (!file) return null;
	const el = treeRow(parent, note.title, () => {
		// Going where you already are is not a move.
		if (context.app.workspace.getActiveFile() !== file) void reveal(context.app, file);
	});
	el.dataset.path = note.path;
	el.setAttribute('aria-label', tooltip);
	el.addEventListener('contextmenu', (event) => rowMenu(context, file, el, event));
	return { el, file };
}

/** File the note, or change one answer on it: the same menu the file explorer has. */
function rowMenu(context: Context, file: TFile, el: HTMLElement, event: MouseEvent): void {
	const menu = new Menu();
	addFilingItems(menu, context, file);
	event.preventDefault();
	// The context-menu key arrives with no pointer to anchor to.
	if (event.clientX === 0 && event.clientY === 0) {
		const box = el.getBoundingClientRect();
		menu.showAtPosition({ x: box.left, y: box.bottom });
	} else {
		menu.showAtMouseEvent(event);
	}
}

/** Bring a note into view: the pane it is already in, or a new tab, so the inbox stays put. */
async function reveal(app: App, file: TFile): Promise<void> {
	const open = app.workspace
		.getLeavesOfType('markdown')
		.find((leaf) => leaf.view instanceof MarkdownView && leaf.view.file === file);
	if (open) {
		await app.workspace.revealLeaf(open);
		app.workspace.setActiveLeaf(open, { focus: true });
		return;
	}
	await app.workspace.getLeaf('tab').openFile(file);
}

/** Mark the row for the note you have open, the way the file explorer does. */
function highlight(root: HTMLElement, app: App): void {
	const active = app.workspace.getActiveFile()?.path ?? null;
	for (const row of Array.from(root.querySelectorAll<HTMLElement>('.tree-item-self[data-path]'))) {
		row.toggleClass('is-active', row.dataset.path === active);
	}
}

function iconButton(parent: HTMLElement, icon: string, label: string, onClick: () => void): void {
	const button = parent.createEl('button', { cls: 'clickable-icon', attr: { 'aria-label': label } });
	setIcon(button, icon);
	button.addEventListener('click', (event) => {
		// The row under it opens the note, which is not what the button was for.
		event.stopPropagation();
		onClick();
	});
}

/** One row, in the file explorer's markup so the theme styles it as one. */
function treeRow(parent: HTMLElement, text: string, onClick: () => void): HTMLElement {
	const self = parent
		.createDiv({ cls: 'tree-item nav-file' })
		.createDiv({ cls: 'tree-item-self nav-file-title is-clickable', attr: { tabindex: '0' } });
	self.createDiv({ cls: 'tree-item-inner nav-file-title-content', text });
	self.addEventListener('click', onClick);
	self.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		onClick();
	});
	return self;
}

interface Folder {
	label: string;
	icon: string;
	hint: string;
	count: number;
	open: boolean;
	/** How it folds, or nothing for a section that is always open. */
	toggle?: () => void;
	cls?: string;
}

/**
 * One section, in the file explorer's folder markup, with its count where the
 * explorer puts one. An empty section stays, faint, so the block keeps its
 * shape. Hands back the element to draw rows into, or null when it is empty or
 * shut.
 */
function folder(root: HTMLElement, { label, icon, hint, count, open, toggle, cls }: Folder): HTMLElement | null {
	const empty = count === 0;
	const fixed = empty || toggle === undefined;
	const shut = !fixed && !open;
	const el = root.createDiv({
		cls: ['tree-item', 'nav-folder', ...(shut ? ['is-collapsed'] : []), ...(empty ? ['loose-ends-empty'] : []), ...(cls ? [cls] : [])],
	});
	const header = el.createDiv({
		cls: `tree-item-self nav-folder-title${fixed ? '' : ' is-clickable mod-collapsible'}`,
		attr: fixed ? { 'aria-label': hint } : { 'aria-label': hint, tabindex: '0' },
	});
	setIcon(header.createDiv({ cls: 'tree-item-icon loose-ends-section-icon' }), icon);
	header.createDiv({ cls: 'tree-item-inner nav-folder-title-content', text: label });
	header.createDiv({ cls: 'tree-item-flair-outer' }).createSpan({ cls: 'tree-item-flair', text: String(count) });

	if (empty) return null;
	if (toggle !== undefined) {
		header.addEventListener('click', toggle);
		header.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			toggle();
		});
	}
	// Obsidian styles `is-collapsed` but hides nothing with it: the file
	// explorer drops the children instead, and so does this.
	if (shut) return null;
	return el.createDiv({ cls: 'tree-item-children nav-folder-children' });
}
