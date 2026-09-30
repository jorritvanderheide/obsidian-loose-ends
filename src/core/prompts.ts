// What a template asks under its headings, drawn in the note rather than
// written into it.
//
// A prompt is an HTML comment that is the first thing under a heading in a
// template. Add note leaves it out of the note it makes, and the editor draws
// it on the empty line under that heading until something is written there.
// Copied into every note, a prompt went stale when the template was reworded
// and stayed under the answer once it was given. Drawn, it is in no file.
// Paper Trail's questions work the same way, for the same reasons.

/** A heading in a template or a note. */
interface Heading {
	/** The line it is on, counted from zero. */
	line: number;
	level: number;
	text: string;
}

/** A prompt in a template: the lines its comment takes up, and what it says. */
interface Comment {
	start: number;
	end: number;
	text: string;
}

/** What one template asks, and under which headings. */
export interface TemplatePrompts {
	/** The heading carrying `{{title}}`, which a note has under its own name. */
	title: { level: number; prompt: string | null } | null;
	/** Every other heading, which is how a note made from it is recognised. */
	sections: { text: string; prompt: string | null }[];
}

/** One prompt to draw: the line it goes on, counted from zero, and the words. */
export interface Ghost {
	line: number;
	text: string;
}

const TITLE = /\{\{\s*title\s*\}\}/i;
const HEADING = /^(#{1,6})\s+(.*)$/;
const FENCE = /^\s*(```|~~~)/;

/**
 * The headings in a text.
 *
 * Frontmatter and fenced code are skipped, because a line starting with `#`
 * there is YAML or a shell comment, not a heading.
 */
function headingsIn(lines: readonly string[]): Heading[] {
	let from = 0;
	if (lines[0]?.trim() === '---') {
		const close = lines.findIndex((line, n) => n > 0 && line.trim() === '---');
		from = close === -1 ? lines.length : close + 1;
	}

	const found: Heading[] = [];
	let fence: string | null = null;
	for (let n = from; n < lines.length; n++) {
		const line = lines[n] ?? '';
		const marker = FENCE.exec(line)?.[1];
		if (marker !== undefined) {
			if (fence === null) fence = marker;
			else if (marker === fence) fence = null;
			continue;
		}
		if (fence !== null) continue;
		const match = HEADING.exec(line);
		if (match) found.push({ line: n, level: (match[1] ?? '').length, text: (match[2] ?? '').trim() });
	}
	return found;
}

/**
 * The prompt under the heading on line `at`, or null when there is none.
 *
 * Only a comment that is the first thing under the heading, on lines of its
 * own. A comment with words after it on the same line is part of the text, and
 * an empty one asks nothing.
 */
function promptUnder(lines: readonly string[], at: number): Comment | null {
	let start = at + 1;
	while (start < lines.length && lines[start]?.trim() === '') start++;
	if (!(lines[start] ?? '').trimStart().startsWith('<!--')) return null;

	for (let end = start; end < lines.length; end++) {
		const line = lines[end] ?? '';
		const close = line.indexOf('-->');
		if (close === -1) continue;
		if (line.slice(close + 3).trim() !== '') return null;
		const body = lines.slice(start, end + 1).join('\n');
		const text = body.slice(body.indexOf('<!--') + 4, body.lastIndexOf('-->')).replace(/\s+/g, ' ').trim();
		return text === '' ? null : { start, end, text };
	}
	return null;
}

/**
 * The text of a template's title heading, the first one carrying `{{title}}`,
 * or null when it has none. Found the way `readPrompts` finds it, so a `#` in
 * frontmatter or fenced code is never mistaken for it.
 */
export function titleHeading(template: string): string | null {
	return headingsIn(template.split('\n')).find((heading) => TITLE.test(heading.text))?.text ?? null;
}

/** What a template asks under each of its headings. */
export function readPrompts(template: string): TemplatePrompts {
	const lines = template.split('\n');
	let title: TemplatePrompts['title'] = null;
	const sections: TemplatePrompts['sections'] = [];

	for (const heading of headingsIn(lines)) {
		const prompt = promptUnder(lines, heading.line)?.text ?? null;
		if (TITLE.test(heading.text)) {
			title ??= { level: heading.level, prompt };
			continue;
		}
		sections.push({ text: heading.text, prompt });
	}
	return { title, sections };
}

/** Whether nothing but blank lines comes after line `at` before the next heading or the end. */
function onlyBlanksAfter(lines: readonly string[], at: number): boolean {
	for (const line of lines.slice(at + 1)) {
		if (HEADING.test(line)) return true;
		if (line.trim() !== '') return false;
	}
	return true;
}

/**
 * The template with its prompts taken out, to make a note from.
 *
 * A prompt that is all its section holds leaves an empty line where it was,
 * so the note has a line of its own to draw the prompt on, with a blank line
 * above and below it like any paragraph: the section looks the same before
 * and after it is written in. A prompt with something under it, such as
 * `{{cursor}}`, gives its place to that instead: where it sat between two
 * blank lines, one of them goes with it. Every other comment is kept.
 */
export function withoutPrompts(template: string): string {
	const lines = template.split('\n');
	const prompts = headingsIn(lines)
		.map((heading) => promptUnder(lines, heading.line))
		.filter((comment): comment is Comment => comment !== null);

	// From the bottom up, so the line numbers of the ones still to go hold.
	for (const { start, end } of prompts.reverse()) {
		if (onlyBlanksAfter(lines, end)) {
			lines.splice(start, end - start + 1, '');
			continue;
		}
		const blankBefore = lines[start - 1]?.trim() === '';
		lines.splice(start, end - start + 1);
		if (blankBefore && lines[start]?.trim() === '') lines.splice(start, 1);
	}
	return lines.join('\n');
}

/**
 * The line to draw a heading's prompt on, or null when there should be none.
 *
 * The empty line under an empty section: under the blank that separates it
 * from the heading when there is one, which is where Add note leaves the
 * cursor, and directly under the heading when that is all the room there is.
 * Nothing once anything is written under it, because a question over its own
 * answer is what took the prompts out of the notes. Paper Trail's
 * `questionLine`, for any heading.
 */
function emptyLineUnder(lines: readonly string[], at: number): number | null {
	for (const line of lines.slice(at + 1)) {
		if (HEADING.test(line)) break;
		if (line.trim() !== '') return null;
	}
	const blank = (n: number) => n < lines.length && lines[n]?.trim() === '';
	if (blank(at + 1) && blank(at + 2)) return at + 2;
	return blank(at + 1) ? at + 1 : null;
}

/**
 * The template a note was made from, recognised by its headings.
 *
 * A note keeps no record of its template, and keeping one would be a second
 * copy of something the note already shows. So a note belongs to the template
 * whose every heading it has, and to the one with the most of them when several
 * fit. A template with no heading besides the title is recognised by nothing:
 * its title prompt would otherwise land under the title of every note there is.
 */
function templateOf(headings: readonly Heading[], templates: readonly TemplatePrompts[]): TemplatePrompts | null {
	const has = new Set(headings.map((heading) => heading.text.toLowerCase()));
	let best: TemplatePrompts | null = null;
	for (const template of templates) {
		if (template.sections.length === 0) continue;
		if (!template.sections.every((section) => has.has(section.text.toLowerCase()))) continue;
		if (best === null || template.sections.length > best.sections.length) best = template;
	}
	return best;
}

/**
 * What to draw in a note, and on which lines.
 *
 * The prompts of the template the note was made from, each on the empty line
 * under its heading. The title heading is found by its level, since its text is
 * the note's own name.
 */
export function ghostsFor(note: string, templates: readonly TemplatePrompts[]): Ghost[] {
	const lines = note.split('\n');
	const headings = headingsIn(lines);
	const template = templateOf(headings, templates);
	if (template === null) return [];

	const asks: { heading: Heading | undefined; prompt: string | null }[] = template.sections.map((section) => ({
		heading: headings.find((heading) => heading.text.toLowerCase() === section.text.toLowerCase()),
		prompt: section.prompt,
	}));
	if (template.title !== null) {
		const level = template.title.level;
		asks.push({ heading: headings.find((heading) => heading.level === level), prompt: template.title.prompt });
	}

	const ghosts = new Map<number, string>();
	for (const { heading, prompt } of asks) {
		if (heading === undefined || prompt === null) continue;
		const line = emptyLineUnder(lines, heading.line);
		if (line !== null && !ghosts.has(line)) ghosts.set(line, prompt);
	}
	return [...ghosts].map(([line, text]) => ({ line, text })).sort((a, b) => a.line - b.line);
}
