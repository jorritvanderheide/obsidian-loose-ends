// Filling a template in, which is three placeholders and deliberately no more.

import { cleanFolder } from './note';
import { titleHeading } from './prompts';

const TITLE = /\{\{\s*title\s*\}\}/gi;
/**
 * `{{date}}`, or `{{date:YYYY-MM}}` and `{{date:YYYY}}` for the same date cut
 * short. The first group is the precision, when one was given.
 */
const DATE = /\{\{\s*date\s*(?::\s*(YYYY(?:-MM(?:-DD)?)?)\s*)?\}\}/gi;

/** How many characters of `YYYY-MM-DD` a precision keeps: all of it without one. */
function widthOf(precision: string | undefined): number {
	return precision === undefined ? 10 : precision.length;
}

/**
 * A date at each precision, most precise first, standing on its own in a
 * name: the first group. Matched with a group rather than a lookbehind, which
 * older iOS cannot parse, and one regex it cannot parse stops the whole plugin
 * loading there.
 */
const DATES_IN_NAMES: [number, RegExp][] = [
	[10, /(?:^|[^\d-])(\d{4}-\d{2}-\d{2})(?![\d-])/],
	[7, /(?:^|[^\d-])(\d{4}-\d{2})(?![\d-])/],
	[4, /(?:^|[^\d-])(\d{4})(?![\d-])/],
];

/**
 * A template's text with the note's title and date in it.
 *
 * `{{title}}`, `{{date}}` and `{{cursor}}` are the only placeholders, matched
 * whatever their case and spacing, because a template language is a second
 * thing to learn and the rest of a template is markdown that is already being
 * written. `{{date}}` is there because a note about something that happened is
 * named after the day it happened, and typing that day on every meeting is the
 * kind of chore a template is for. It takes a precision, not a format:
 * `{{date:YYYY-MM}}` for a note about a month, `{{date:YYYY}}` for a year,
 * each the same date cut short, so it still sorts. Anything else after the
 * colon is not a placeholder and is left as it stands, like a template naming
 * none of them. A placeholder never gets more of the date than there is: a
 * month typed in a name fills `{{date}}` with that month.
 */
export function fillTemplate(template: string, title: string, date: string): string {
	// Functions, not strings, as the replacement: a string would read `$&` or
	// `$'` in a typed name as a pattern and write something else.
	return template
		.replace(TITLE, () => title)
		.replace(DATE, (_match, precision: string | undefined) => date.slice(0, widthOf(precision)));
}

/** A day as `{{date}}` writes it, `YYYY-MM-DD`, in local time. */
export function isoDate(day: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/**
 * The date a typed name already carries, or null: a whole `YYYY-MM-DD`, or,
 * when `width` allows it, a `YYYY-MM` or a `YYYY`. Only a name dated at that
 * precision is read that loosely, so `Budget 2026-10` names a month only where
 * a month is asked for.
 */
export function dateIn(name: string, width = 10): string | null {
	for (const [at, pattern] of DATES_IN_NAMES) {
		if (at < width) break;
		const found = pattern.exec(name)?.[1];
		if (found !== undefined) return found;
	}
	return null;
}

/**
 * How much of the date a template puts in the name of the notes made from it,
 * as a width of `YYYY-MM-DD`, or null when it puts none. It does by carrying a
 * date placeholder in its title heading, and the first one there counts.
 */
function nameDateWidth(template: string): number | null {
	const heading = titleHeading(template);
	if (heading === null) return null;
	const found = new RegExp(DATE.source, 'i').exec(heading);
	return found === null ? null : widthOf(found[1]);
}

/**
 * Whether a template puts the date in the name of the notes made from it,
 * which it does by carrying `{{date}}` in its title heading.
 */
export function datesName(template: string): boolean {
	return nameDateWidth(template) !== null;
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
 * prepared before the day. A heading dated to the month, `{{date:YYYY-MM}}`,
 * also takes a typed `YYYY-MM`, for a month written up after it ended.
 * Everywhere else `{{date}}` is that same date.
 */
export function makeNote(template: string, typed: string, today: string): { name: string; text: string } {
	const name = typed.trim();
	const width = nameDateWidth(template);
	const typedDate = dateIn(name, width ?? 10);
	const date = typedDate ?? today;
	const heading = width === null ? null : titleHeading(template);
	const title =
		heading !== null && typedDate !== null ? name.replace(typedDate, () => '').replace(/\s+/g, ' ').trim() : name;
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
