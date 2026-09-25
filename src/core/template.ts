// Filling a template in, which is two placeholders and deliberately no more.

import { cleanFolder } from './note';

/**
 * A template's text with the note's title in it.
 *
 * `{{title}}` and `{{cursor}}` are the only placeholders, matched whatever
 * their case and spacing, because a template language is a second thing to
 * learn and the rest of a template is markdown that is already being written.
 * A template naming neither is used as it stands.
 */
export function fillTemplate(template: string, title: string): string {
	return template.replace(/\{\{\s*title\s*\}\}/gi, title);
}

const CURSOR = /\{\{\s*cursor\s*\}\}/gi;

/**
 * The text with every `{{cursor}}` taken out, and where the first one was.
 *
 * Counted from the end rather than the start, because the mirror writes the
 * frontmatter after the note is made, and that moves everything below it
 * except its distance from the end. Null when there was none.
 */
export function placeCursor(text: string): { text: string; fromEnd: number | null } {
	const at = text.search(CURSOR);
	const clean = text.replace(CURSOR, '');
	return { text: clean, fromEnd: at === -1 ? null : clean.length - at };
}

/**
 * Whether a file is one of the templates on offer: a markdown file directly in
 * the template folder. A change to one means the prompts drawn in notes are out
 * of date.
 */
export function isTemplate(path: string, templateFolder: string): boolean {
	const folder = cleanFolder(templateFolder);
	if (folder === '' || !path.startsWith(`${folder}/`) || !path.endsWith('.md')) return false;
	return !path.slice(folder.length + 1).includes('/');
}

/** The name a template file is offered under: its basename, without `.md`. */
export function templateName(path: string): string {
	const base = path.slice(path.lastIndexOf('/') + 1);
	return base.endsWith('.md') ? base.slice(0, -3) : base;
}

/**
 * The template written once, on a fresh install, so the new-note prompt offers
 * something before anyone has made a template of their own.
 *
 * The empty first line keeps the heading clear of the frontmatter the mirror
 * writes above it.
 */
export const STARTER_TEMPLATE = { name: 'Unfiled', text: '\n# {{title}}\n\n{{cursor}}' };
