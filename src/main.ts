import { Notice, Plugin, TFile } from 'obsidian';
import { addNote, writeStarterTemplate } from './commands/add-note';
import { fileNote, setAxis } from './commands/file-note';
import type { Context } from './context';
import type { TemplatePrompts } from './core/prompts';
import { inScope } from './core/scope';
import { activeAxes, loadSettings, mirrorKey, type Settings } from './core/settings';
import { isTemplate } from './core/template';
import { announceInboxChange, FilingWatch } from './inbox';
import { syncMirror, sweepMirror } from './mirror';
import { templatePrompts } from './templates';
import { ghosts, redrawGhosts } from './ui/ghost';
import { INBOX_BLOCK, InboxBlock } from './ui/inbox-block';
import { addFilingItems } from './ui/note-menu';
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
	/**
	 * What the templates ask, read again whenever one of them changes, so the
	 * drawn prompts follow the template's current wording. Held here because the
	 * editor draws synchronously and a file read is not.
	 */
	private prompts: TemplatePrompts[] = [];
	/** The template folder `prompts` was read from, to notice it moving. */
	private promptsFrom: string | null = null;
	/** The namespaces a Set command is registered for. */
	private axisCommands = new Set<string>();
	/** What the last sweep checked against (`mirrorKey`), to notice it changing. */
	private sweptFor: string | null = null;
	private settingTab = new LooseEndsSettingTab(this.app, this);
	/** When a note went from unfiled to filed, for the inbox block's Recently filed. */
	private watch = new FilingWatch(this.app, () => this.settings);

	async onload(): Promise<void> {
		const data: unknown = await this.loadData();
		this.settings = loadSettings(data);
		this.addSettingTab(this.settingTab);

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

		this.syncAxisCommands();

		this.registerMarkdownCodeBlockProcessor(INBOX_BLOCK, (_source, el, ctx) => {
			ctx.addChild(new InboxBlock(el, this.context(), ctx.sourcePath));
		});

		// Filing on a note's own menu, wherever Obsidian offers one: the file
		// explorer, a tab's header, a link.
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== 'md') return;
				if (!inScope(file.path, this.settings)) return;
				addFilingItems(menu, this.context(), file);
			}),
		);

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				this.watch.noteChanged(file);
				void this.onNoteChanged(file);
			}),
		);

		this.registerEditorExtension(
			ghosts({
				inScope: (path) => inScope(path, this.settings),
				prompts: () => this.prompts,
			}),
		);

		// The cache is not ready during onload, so the first sweep waits for it.
		// So do the template listeners: the vault reports a create for every file
		// while it loads, and each would read every template again.
		this.app.workspace.onLayoutReady(() => {
			void this.sweep(true);
			void this.readPrompts();
			const changed = (path: string) => {
				if (isTemplate(path, this.settings.templateFolder)) void this.readPrompts();
			};
			this.registerEvent(this.app.vault.on('modify', (file) => changed(file.path)));
			this.registerEvent(this.app.vault.on('create', (file) => changed(file.path)));
			this.registerEvent(
				this.app.vault.on('delete', (file) => {
					changed(file.path);
					this.watch.deleted(file.path);
				}),
			);
			this.registerEvent(
				this.app.vault.on('rename', (file, old) => {
					changed(file.path);
					changed(old);
					if (file instanceof TFile) this.watch.renamed(file, old);
				}),
			);
			if (data === null) void this.firstRun();
		});
	}

	/** Read what every template asks, and draw the open notes again. */
	private async readPrompts(): Promise<void> {
		this.promptsFrom = this.settings.templateFolder;
		this.prompts = await templatePrompts(this.app, this.settings.templateFolder);
		redrawGhosts();
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

	/**
	 * One Set command per axis, so a value can be changed without going through
	 * filing. Added and removed as the axes change, so the palette never offers
	 * an axis that is gone.
	 */
	private syncAxisCommands(): void {
		const namespaces = new Set(activeAxes(this.settings).map((axis) => axis.namespace));
		for (const namespace of this.axisCommands) {
			if (namespaces.has(namespace)) continue;
			this.removeCommand(`set-${namespace}`);
			this.axisCommands.delete(namespace);
		}
		for (const namespace of namespaces) {
			if (this.axisCommands.has(namespace)) continue;
			this.addCommand({
				id: `set-${namespace}`,
				name: `Set ${namespace}`,
				// Looked up when run, so it asks with the values as they are now.
				callback: () => {
					const axis = activeAxes(this.settings).find((entry) => entry.namespace === namespace);
					if (axis) void setAxis(this.context(), axis);
				},
			});
			this.axisCommands.add(namespace);
		}
	}

	/**
	 * Sweep again if anything that decides the unfiled tag changed since the last
	 * sweep: the axes, the tag, or the folders. `quiet` for a change nobody made
	 * on this device.
	 */
	async sweepIfChanged(quiet = false): Promise<void> {
		if (mirrorKey(this.settings) === this.sweptFor) return;
		await this.sweep(quiet);
	}

	/** Check every note in scope. `quiet` for the one on startup. */
	async sweep(quiet = false): Promise<void> {
		this.sweptFor = mirrorKey(this.settings);
		// The axes may have filed or unfiled notes by the dozen, and none of that
		// is somebody filing a note, so the watch starts again from here.
		this.watch.reset();
		const changed = await sweepMirror(this.app, this.settings);
		if (quiet) return;
		new Notice(changed === 0 ? "Every note's tags were already up to date." : `Updated the tags on ${changed} note${changed === 1 ? '' : 's'}.`);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		await this.settingsChanged();
	}

	/**
	 * Settings saved on another device and brought here by a sync. Without this,
	 * this device would go on writing the unfiled tag by the axes it loaded with,
	 * and undo every note the other device tagged by the new ones.
	 *
	 * Loaded into the same object, because the inbox blocks hold the settings
	 * they were drawn with.
	 */
	async onExternalSettingsChange(): Promise<void> {
		const data: unknown = await this.loadData();
		Object.assign(this.settings, loadSettings(data));
		await this.settingsChanged();
		this.settingTab.update();
		// Before the layout is ready, the sweep on startup is still to come.
		if (this.app.workspace.layoutReady) await this.sweepIfChanged(true);
	}

	/** Bring everything that follows the settings in line with them. */
	private async settingsChanged(): Promise<void> {
		this.syncAxisCommands();
		// A settings change can file or unfile notes, and that is never somebody
		// filing one, so the watch takes stock again rather than logging it.
		this.watch.reset();
		announceInboxChange(this.app);
		if (this.settings.templateFolder !== this.promptsFrom) await this.readPrompts();
	}
}
