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
				desc: "Add note offers every Markdown file in this folder as a template. In a template, {{title}} becomes the note's name, {{date}} becomes today's date as YYYY-MM-DD, and the cursor starts at {{cursor}}. Use {{date:YYYY-MM}} or {{date:YYYY}} for just the month or the year. With {{date}} in the title heading, the note's name gets the date too, unless you type a date yourself. An HTML comment right under a heading is shown faintly in the note as a prompt, and never copied into it.",
				control: { type: 'folder', key: 'templateFolder' },
			},
			{
				name: 'Remember the last template',
				desc: "Put the template you picked last at the top of the list. When this is off, Default comes first and the rest follow by name.",
				control: { type: 'toggle', key: 'rememberTemplate' },
			},
			{
				name: 'Unfiled tag',
				desc: "Loose Ends adds this tag to a note that's still missing an answer, and takes it off once every answer is in. In Tag Along, or another plugin that shows your tags as folders, it becomes a folder of every note still waiting. The inbox block names its first group after it too. Leave it empty if you don't want the tag.",
				control: { type: 'text', key: 'unfiledTag', placeholder: 'inbox' },
			},
			{
				type: 'page',
				name: 'Axes',
				desc: "The questions a note has to answer before it counts as filed. Each axis is a top-level tag, like domain, with the values it accepts, like work and personal. Only those exact values count as answers. A tag like domain/work/project-x doesn't, unless you add work/project-x to the list.",
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
