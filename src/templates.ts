// The template folder, for the two things that read it: Add note, which offers
// its files, and the ghost text, which draws what they ask.

import { TFile, TFolder, normalizePath, type App } from 'obsidian';
import { cleanFolder } from './core/note';
import { readPrompts, type TemplatePrompts } from './core/prompts';

/** The templates on offer: every markdown file directly in the template folder. */
export function templateFiles(app: App, templateFolder: string): TFile[] {
	const folder = cleanFolder(templateFolder);
	if (folder === '') return [];
	const found = app.vault.getAbstractFileByPath(normalizePath(folder));
	if (!(found instanceof TFolder)) return [];
	return found.children
		.filter((child): child is TFile => child instanceof TFile && child.extension === 'md')
		.sort((a, b) => a.basename.localeCompare(b.basename));
}

/** What every template asks, read from the files as they are now. */
export async function templatePrompts(app: App, templateFolder: string): Promise<TemplatePrompts[]> {
	return Promise.all(templateFiles(app, templateFolder).map(async (file) => readPrompts(await app.vault.cachedRead(file))));
}
