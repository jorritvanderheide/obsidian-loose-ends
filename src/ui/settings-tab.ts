import { PluginSettingTab, type App, type SettingDefinitionItem } from 'obsidian';
import type LooseEndsPlugin from '../main';
import { normaliseNamespace } from '../core/vocabulary';

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
				desc: 'Where a new note is made, and the only folder Loose Ends tags. Empty means the whole vault.',
				control: { type: 'folder', key: 'notesFolder' },
			},
			{
				name: 'Template folder',
				desc: 'Markdown files here are offered when a note is made. {{title}} becomes the name of the note, and the cursor starts at {{cursor}}.',
				control: { type: 'folder', key: 'templateFolder' },
			},
			{
				name: 'Unfiled tag',
				desc: 'Written on a note that has not answered every axis, and taken off when it has. It is what gives a tag tree a folder of them. Empty writes none.',
				control: { type: 'text', key: 'unfiledTag', placeholder: 'status/unfiled' },
			},
			{
				type: 'page',
				name: 'Axes',
				desc: 'What a note has to answer before it counts as filed. One tag namespace each, with the values it accepts. Values are compared exactly, so a nested tag never counts as an answer.',
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
							void this.commit();
						},
						items: settings.axes.map((axis, index) => ({
							name: `Axis ${index + 1}`,
							render: (setting) => {
								setting
									.addText((text) =>
										text.setPlaceholder('Namespace').setValue(axis.namespace).onChange(async (value) => {
											axis.namespace = normaliseNamespace(value);
											await this.plugin.saveSettings();
										}),
									)
									.addText((text) =>
										text
											.setPlaceholder('Value, value, value')
											.setValue(axis.values.join(', '))
											.onChange(async (value) => {
												axis.values = value
													.split(',')
													.map((entry) => entry.trim())
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
				desc: 'Check every note in the notes folder against the axes. Run this after changing them.',
				action: () => void this.plugin.sweep(),
			},
		];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const text = typeof value === 'string' ? value.trim() : '';
		const settings = this.plugin.settings;
		if (key === 'notesFolder') settings.notesFolder = text;
		else if (key === 'templateFolder') settings.templateFolder = text;
		else if (key === 'unfiledTag') settings.unfiledTag = text.replace(/^#+/, '');
		await this.plugin.saveSettings();
	}
}

function countLabel(count: number): string {
	if (count === 0) return 'None';
	return `${count} ${count === 1 ? 'axis' : 'axes'}`;
}
