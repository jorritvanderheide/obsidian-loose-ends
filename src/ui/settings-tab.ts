import { PluginSettingTab, type App, type SettingDefinitionItem } from 'obsidian';
import type LooseEndsPlugin from '../main';
import { normaliseNamespace, normaliseValue } from '../core/vocabulary';

export class LooseEndsSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: LooseEndsPlugin,
	) {
		super(app, plugin);
	}

	/** Saves, then rebuilds the definitions, which Obsidian only does on update(). */
	private async commit(): Promise<void> {
		await this.plugin.saveSettings();
		this.update();
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const settings = this.plugin.settings;
		return [
			{
				name: 'Notes folder',
				desc: 'Where Add note makes new notes, and the only folder where Loose Ends adds tags. Leave it empty for the whole vault.',
				control: { type: 'folder', key: 'notesFolder' },
			},
			{
				name: 'Template folder',
				desc: "The templates Add note offers: every Markdown file in this folder. {{title}} becomes the note's name, {{date}} today's date as YYYY-MM-DD ({{date:YYYY-MM}} or {{date:YYYY}} for less of it), and the cursor starts at {{cursor}}. A title heading with {{date}} in it puts the date in the note's name too, unless you type a date yourself. An HTML comment right under a heading becomes that heading's prompt: it's shown in the note, not copied into it.",
				control: { type: 'folder', key: 'templateFolder' },
			},
			{
				name: 'Remember the last template',
				desc: "Offer the template you picked last first. When it's off, Default comes first, then the rest by name.",
				control: { type: 'toggle', key: 'rememberTemplate' },
			},
			{
				name: 'Unfiled tag',
				desc: "Added to a note that's still missing an answer, and taken off once it has them all. It's what gives a tag tree a folder of everything still waiting. Leave it empty for no tag.",
				control: { type: 'text', key: 'unfiledTag', placeholder: 'status/unfiled' },
			},
			{
				type: 'page',
				name: 'Axes',
				desc: "The questions a note has to answer before it counts as filed. Each axis is a top-level tag, like domain, with the values it accepts, like work and personal. Values are compared exactly, so a tag that isn't in the list, nested or not, never counts as an answer.",
				displayValue: () => countLabel(settings.axes.length),
				items: [
					{
						type: 'list',
						emptyState: 'No axes yet, so every note counts as filed. Add one to start.',
						addItem: {
							name: 'Add axis',
							action: () => {
								settings.axes.push({ namespace: '', values: [] });
								void this.commit();
							},
						},
						onDelete: (index) => {
							settings.axes.splice(index, 1);
							void this.commit().then(() => this.plugin.sweepIfAxesChanged());
						},
						items: settings.axes.map((axis, index) => ({
							name: `Axis ${index + 1}`,
							render: (setting) => {
								setting
									.addText((text) =>
										text.setPlaceholder('Top-level tag, like domain').setValue(axis.namespace).onChange(async (value) => {
											axis.namespace = normaliseNamespace(value);
											await this.plugin.saveSettings();
										}),
									)
									.addText((text) =>
										text
											.setPlaceholder('Values, like work, personal')
											.setValue(axis.values.join(', '))
											.onChange(async (value) => {
												axis.values = value
													.split(',')
													.map((entry) => normaliseValue(entry))
													.filter((entry) => entry !== '');
												await this.plugin.saveSettings();
											}),
									);
							},
						})),
					},
				],
			},
			{
				name: 'Refresh tags',
				desc: 'Check every note in the notes folder against the axes. This also runs by itself when you remove an axis, and when you close the settings after changing the axes.',
				action: () => void this.plugin.sweep(),
			},
		];
	}

	/**
	 * Adding an axis and typing its values out are sweeps waiting for the last
	 * keystroke, so they wait for the tab to close instead.
	 */
	hide(): void {
		super.hide();
		void this.plugin.sweepIfAxesChanged();
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const text = typeof value === 'string' ? value.trim() : '';
		const settings = this.plugin.settings;
		if (key === 'notesFolder') settings.notesFolder = text;
		else if (key === 'templateFolder') settings.templateFolder = text;
		else if (key === 'rememberTemplate') settings.rememberTemplate = value === true;
		else if (key === 'unfiledTag') settings.unfiledTag = text.replace(/^#+/, '');
		await this.plugin.saveSettings();
	}
}

function countLabel(count: number): string {
	if (count === 0) return 'None';
	return `${count} ${count === 1 ? 'axis' : 'axes'}`;
}
