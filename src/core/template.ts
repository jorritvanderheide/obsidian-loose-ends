// Filling a template in, which is three placeholders and deliberately no more.

import { cleanFolder } from './note';
import { titleHeading } from './prompts';

const TITLE = /\{\{\s*title\s*\}\}/gi;
const DATE = /\{\{\s*date\s*\}\}/gi;
/** A date as `{{date}}` writes it, standing on its own in a name. */
const ISO_DATE = /(?<![\d-])\d{4}-\d{2}-\d{2}(?![\d-])/;

/**
 * A template's text with the note's title and date in it.
 *
 * `{{title}}`, `{{date}}` and `{{cursor}}` are the only placeholders, matched
 * whatever their case and spacing, because a template language is a second
 * thing to learn and the rest of a template is markdown that is already being
 * written. `{{date}}` is there because a note about something that happened is
 * named after the day it happened, and typing that day on every meeting is the
 * kind of chore a template is for. It takes no format: one date, written the
 * way that sorts. A template naming none of them is used as it stands.
 */
export function fillTemplate(template: string, title: string, date: string): string {
	return template.replace(TITLE, title).replace(DATE, date);
}

/** A day as `{{date}}` writes it, `YYYY-MM-DD`, in local time. */
export function isoDate(day: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** The `YYYY-MM-DD` date a typed name already carries, or null. */
export function dateIn(name: string): string | null {
	return ISO_DATE.exec(name)?.[0] ?? null;
}

/**
 * Whether a template puts the date in the name of the notes made from it,
 * which it does by carrying `{{date}}` in its title heading.
 */
export function datesName(template: string): boolean {
	const heading = titleHeading(template);
	return heading !== null && new RegExp(DATE.source, 'i').test(heading);
}

/**
 * The name and text of a note made from a template, given the typed name and
 * today's date.
 *
 * The name is what was typed, unless the title heading carries `{{date}}`: then
 * the note is named after that heading filled in, so `# {{title}} {{date}}` and
 * `Hanna` make `Hanna 2026-09-30`, and the name and the heading agree. A date
 * typed in the name is the note's date instead of today's, taken out of the
 * title so it isn't written twice: `Hanna 2026-10-07` stays that, for a meeting
 * prepared before the day. Everywhere else `{{date}}` is that same date.
 */
export function makeNote(template: string, typed: string, today: string): { name: string; text: string } {
	const name = typed.trim();
	const typedDate = dateIn(name);
	const date = typedDate ?? today;
	const heading = datesName(template) ? titleHeading(template) : null;
	const title =
		heading !== null && typedDate !== null ? name.replace(typedDate, '').replace(/\s+/g, ' ').trim() : name;
	return {
		name: heading === null ? name : fillTemplate(heading, title, date).trim(),
		text: fillTemplate(template, title, date),
	};
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
export const STARTER_TEMPLATE = { name: 'Default', text: '\n# {{title}}\n\n{{cursor}}' };
