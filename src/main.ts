import { Notice, Plugin, TFile } from 'obsidian';
import { addNote, writeStarterTemplate } from './commands/add-note';
import { fileNote, setAxis } from './commands/file-note';
import type { Context } from './context';
import { loadSettings, type Settings } from './core/settings';
import { syncMirror, sweepMirror } from './mirror';
import { LooseEndsSettingTab } from './ui/settings-tab';

export default class LooseEndsPlugin extends Plugin {
	settings: Settings = loadSettings({});
	/**
	 * Files a write is already in flight for.
	 *
	 * `processFrontMatter` fires the metadata change that brought us here, and
	 * the value guard in `mirrorIsCurrent` catches that on the next pass. This
	 * catches the pass itself, so two edits in the same tick cannot both open
	 * the same file.
	 */
	private writing = new Set<string>();

	async onload(): Promise<void> {
		const data: unknown = await this.loadData();
		this.settings = loadSettings(data);
		this.addSettingTab(new LooseEndsSettingTab(this.app, this));

		this.addCommand({
			id: 'add-note',
			name: 'Add note',
			callback: () => void addNote(this.context()),
		});

		this.addCommand({
			id: 'file-note',
			name: 'File note',
			callback: () => void fileNote(this.context()),
		});

		this.addCommand({
			id: 'refresh',
			name: 'Refresh tags',
			callback: () => void this.sweep(),
		});

		// One per axis, so a value can be changed without going through filing.
		// Registered from settings, so they follow whatever the vocabulary is.
		for (const axis of this.settings.axes) {
			this.addCommand({
				id: `set-${axis.namespace}`,
				name: `Set ${axis.namespace}`,
				callback: () => void setAxis(this.context(), axis),
			});
		}

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				void this.onNoteChanged(file);
			}),
		);

		// The cache is not ready during onload, so the first sweep waits for it.
		this.app.workspace.onLayoutReady(() => {
			void this.sweep(true);
			if (data === null) void this.firstRun();
		});
	}

	/** Once per vault: saving settings is what makes the next load not the first. */
	private async firstRun(): Promise<void> {
		await this.saveSettings();
		await writeStarterTemplate(this.context());
	}

	private context(): Context {
		return {
			app: this.app,
			settings: this.settings,
			saveSettings: () => this.saveSettings(),
		};
	}

	private async onNoteChanged(file: TFile): Promise<void> {
		if (this.writing.has(file.path)) return;
		this.writing.add(file.path);
		try {
			await syncMirror(this.app, file, this.settings);
		} finally {
			this.writing.delete(file.path);
		}
	}

	/** Check every note in scope. `quiet` for the one on startup. */
	async sweep(quiet = false): Promise<void> {
		const changed = await sweepMirror(this.app, this.settings);
		if (quiet) return;
		new Notice(changed === 0 ? 'Every note was already right.' : `Updated ${changed} note${changed === 1 ? '' : 's'}.`);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
