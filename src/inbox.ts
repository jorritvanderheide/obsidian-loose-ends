// The vault side of the inbox block: which notes there are, and when each one
// was filed.
//
// When is the one thing no tag says, so it is kept in local storage: this
// vault, this device, like the order values were picked in. Losing it costs
// the Recently filed section, never an answer.

import { TFile, type App, type EventRef, type Events } from 'obsidian';
import { isFiled } from './core/filing';
import { readFilings, withFiling, withoutFiling, withRename, type Filing, type InboxNote } from './core/inbox';
import { activeAxes, type Settings } from './core/settings';
import { readTags } from './core/tags';
import { cachedTags } from './frontmatter';
import { inScope } from './mirror';

const FILINGS_KEY = 'loose-ends-filings';

/** Fired when what the block shows changed without a note changing: a filing logged, or settings saved. */
const INBOX_CHANGED = 'loose-ends:inbox-changed';

export function announceInboxChange(app: App): void {
	const events: Events = app.workspace;
	events.trigger(INBOX_CHANGED);
}

export function onInboxChange(app: App, listener: () => void): EventRef {
	const events: Events = app.workspace;
	return events.on(INBOX_CHANGED, listener);
}

export function loadFilings(app: App): Filing[] {
	return readFilings(app.loadLocalStorage(FILINGS_KEY));
}

function saveFilings(app: App, log: Filing[]): void {
	app.saveLocalStorage(FILINGS_KEY, log);
	announceInboxChange(app);
}

function inboxNote(app: App, file: TFile): InboxNote {
	return { path: file.path, title: file.basename, tags: readTags(cachedTags(app, file)), created: file.stat.ctime };
}

/** Every note in the notes folder, as the inbox reads it. */
export function inboxNotes(app: App, settings: Settings): InboxNote[] {
	return app.vault
		.getMarkdownFiles()
		.filter((file) => inScope(file.path, settings.notesFolder))
		.map((file) => inboxNote(app, file));
}

/**
 * Notices a note going from unfiled to filed, and logs when.
 *
 * Only a note changing counts. A change to the axes files or unfiles notes by
 * the hundred without anyone filing anything, so `reset` takes stock again
 * without logging, and Recently filed is not flooded by a settings edit.
 */
export class FilingWatch {
	private unfiled = new Set<string>();

	constructor(
		private readonly app: App,
		private readonly settings: () => Settings,
	) {}

	/**
	 * Take stock without logging: on startup, and whenever settings change.
	 *
	 * A note the metadata cache has not read yet is left out rather than
	 * counted as unfiled. On a new device or a rebuilt cache it has no tags until
	 * it is read, and counting it would log every filed note as filed the moment
	 * the cache caught up.
	 */
	reset(): void {
		const axes = activeAxes(this.settings());
		this.unfiled = new Set(
			this.app.vault
				.getMarkdownFiles()
				.filter((file) => inScope(file.path, this.settings().notesFolder))
				.filter((file) => this.app.metadataCache.getFileCache(file) !== null)
				.filter((file) => !isFiled(axes, readTags(cachedTags(this.app, file))))
				.map((file) => file.path),
		);
	}

	noteChanged(file: TFile): void {
		if (!inScope(file.path, this.settings().notesFolder)) {
			this.unfiled.delete(file.path);
			return;
		}
		const filed = isFiled(activeAxes(this.settings()), readTags(cachedTags(this.app, file)));
		if (filed && this.unfiled.has(file.path)) {
			saveFilings(this.app, withFiling(loadFilings(this.app), file.path, Date.now()));
		}
		if (filed) this.unfiled.delete(file.path);
		else this.unfiled.add(file.path);
	}

	/** A note moved. Its filing follows it, and moving it is not filing it. */
	renamed(file: TFile, from: string): void {
		this.unfiled.delete(from);
		const tags = readTags(cachedTags(this.app, file));
		if (inScope(file.path, this.settings().notesFolder) && !isFiled(activeAxes(this.settings()), tags)) {
			this.unfiled.add(file.path);
		}
		const log = loadFilings(this.app);
		if (log.some((entry) => entry.path === from)) saveFilings(this.app, withRename(log, from, file.path));
	}

	deleted(path: string): void {
		this.unfiled.delete(path);
		const log = loadFilings(this.app);
		if (log.some((entry) => entry.path === path)) saveFilings(this.app, withoutFiling(log, path));
	}
}
