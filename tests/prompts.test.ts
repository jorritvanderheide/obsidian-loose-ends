import { describe, expect, it } from 'vitest';
import { ghostsFor, readPrompts, titleHeading, withoutPrompts } from '../src/core/prompts';
import { fillTemplate, placeCursor } from '../src/core/template';

const DEFINITION = [
	'---',
	'tags:',
	'  - source/own',
	'  - type/living',
	'---',
	'',
	'# {{title}}',
	'',
	'## Definitie',
	'',
	'<!-- Jouw werkdefinitie, in je eigen woorden.',
	'     Herschrijf hem als hij scherper wordt. -->',
	'',
	'{{cursor}}',
	'',
	'## In de literatuur',
	'',
	'<!-- Eén regel per bron. -->',
	'',
	'## Verwant',
	'',
	'<!-- Begrippen die hiermee samenhangen. -->',
	'',
].join('\n');

const MOC = [
	'---',
	'tags:',
	'  - type/living',
	'---',
	'',
	'# {{TITLE}}',
	'',
	'<!-- Waarom deze notities bij elkaar horen,',
	'     in één alinea. -->',
	'',
	'{{cursor}}',
	'',
	'## Notities',
	'',
	'<!-- Eén regel per link.',
	'',
	'     - [[notitie]] wat deze bijdraagt -->',
	'',
].join('\n');

const QUESTION = ['# {{title}}?', '', '## Antwoord nu', '', '<!-- Je huidige antwoord. -->', '', '{{cursor}}', ''].join('\n');

/** A note as Add note makes it from a template. */
function made(template: string, title: string): string {
	return placeCursor(fillTemplate(withoutPrompts(template), title, '2026-09-30')).text;
}

describe('readPrompts', () => {
	it('reads the comment under each heading, on one line', () => {
		expect(readPrompts(DEFINITION)).toEqual({
			title: { level: 1, prompt: null },
			sections: [
				{ text: 'Definitie', prompt: 'Jouw werkdefinitie, in je eigen woorden. Herschrijf hem als hij scherper wordt.' },
				{ text: 'In de literatuur', prompt: 'Eén regel per bron.' },
				{ text: 'Verwant', prompt: 'Begrippen die hiermee samenhangen.' },
			],
		});
	});

	it('reads a prompt under the title, and one with a blank line inside it', () => {
		expect(readPrompts(MOC)).toEqual({
			title: { level: 1, prompt: 'Waarom deze notities bij elkaar horen, in één alinea.' },
			sections: [{ text: 'Notities', prompt: 'Eén regel per link. - [[notitie]] wat deze bijdraagt' }],
		});
	});

	it('knows the title heading by its placeholder, whatever follows it', () => {
		expect(readPrompts(QUESTION).title).toEqual({ level: 1, prompt: null });
	});

	it('skips frontmatter and fenced code, where # is not a heading', () => {
		const template = ['---', '# a yaml comment', '---', '```sh', '# a shell comment', '```', '## Echt', ''].join('\n');
		expect(readPrompts(template).sections).toEqual([{ text: 'Echt', prompt: null }]);
	});

	it('takes only a comment that comes first, on lines of its own, with words in it', () => {
		const later = ['## A', '', 'Tekst.', '', '<!-- te laat -->'].join('\n');
		const inline = ['## A', '', '<!-- deel van --> de tekst'].join('\n');
		const empty = ['## A', '', '<!-- -->'].join('\n');
		for (const template of [later, inline, empty]) {
			expect(readPrompts(template).sections).toEqual([{ text: 'A', prompt: null }]);
		}
	});
});

describe('withoutPrompts', () => {
	it('takes the prompts out and keeps one blank line under each heading', () => {
		expect(withoutPrompts(DEFINITION)).toBe(
			[
				'---',
				'tags:',
				'  - source/own',
				'  - type/living',
				'---',
				'',
				'# {{title}}',
				'',
				'## Definitie',
				'',
				'{{cursor}}',
				'',
				'## In de literatuur',
				'',
				'## Verwant',
				'',
			].join('\n'),
		);
	});

	it('keeps a blank line when the prompt sat right under its heading', () => {
		expect(withoutPrompts(['## A', '<!-- vraag -->', '', 'Tekst.'].join('\n'))).toBe('## A\n\nTekst.');
	});

	it('keeps every comment that is not a prompt', () => {
		const template = ['## A', '', 'Tekst.', '', '<!-- blijft -->', ''].join('\n');
		expect(withoutPrompts(template)).toBe(template);
	});
});

describe('ghostsFor', () => {
	const templates = [readPrompts(DEFINITION), readPrompts(MOC), readPrompts(QUESTION)];

	it('draws each prompt on the empty line under its heading, the cursor line first', () => {
		const note = made(DEFINITION, 'Begrip');
		expect(note.split('\n')[10]).toBe('');
		expect(ghostsFor(note, templates)).toEqual([
			{ line: 10, text: 'Jouw werkdefinitie, in je eigen woorden. Herschrijf hem als hij scherper wordt.' },
			{ line: 13, text: 'Eén regel per bron.' },
			{ line: 15, text: 'Begrippen die hiermee samenhangen.' },
		]);
	});

	it('finds the title heading by its level, whatever the note is called', () => {
		expect(ghostsFor(made(MOC, 'Onderzoeksvragen'), templates)).toEqual([
			{ line: 7, text: 'Waarom deze notities bij elkaar horen, in één alinea.' },
			{ line: 10, text: 'Eén regel per link. - [[notitie]] wat deze bijdraagt' },
		]);
	});

	it('stops asking once something is written under the heading', () => {
		const lines = made(DEFINITION, 'Begrip').split('\n');
		lines[10] = 'Een eerste poging.';
		expect(ghostsFor(lines.join('\n'), templates).map((ghost) => ghost.text)).toEqual([
			'Eén regel per bron.',
			'Begrippen die hiermee samenhangen.',
		]);
	});

	it('asks nothing of a note that has not got every heading of a template', () => {
		expect(ghostsFor(['# Vergadering', '', '## Definitie', '', '## Notes', ''].join('\n'), templates)).toEqual([]);
	});

	it('picks the template with the most headings when several fit', () => {
		const narrow = readPrompts(['## A', '', '<!-- smal -->', ''].join('\n'));
		const wide = readPrompts(['## A', '', '<!-- breed -->', '', '## B', ''].join('\n'));
		expect(ghostsFor(['## A', '', '## B', ''].join('\n'), [narrow, wide])).toEqual([{ line: 1, text: 'breed' }]);
	});

	it('matches headings whatever their case', () => {
		expect(ghostsFor(['# X', '', '## notities', ''].join('\n'), templates)).toEqual([
			{ line: 1, text: 'Waarom deze notities bij elkaar horen, in één alinea.' },
			{ line: 3, text: 'Eén regel per link. - [[notitie]] wat deze bijdraagt' },
		]);
	});

	it('recognises nothing by a template with only a title', () => {
		const titleOnly = readPrompts(['# {{title}}', '', '<!-- alleen de titel -->', ''].join('\n'));
		expect(ghostsFor(['# Wat dan ook', '', ''].join('\n'), [titleOnly])).toEqual([]);
	});

	it('draws nothing where a heading has no empty line under it', () => {
		expect(ghostsFor(['# X', '## Notities'].join('\n'), templates)).toEqual([]);
	});
});

describe('titleHeading', () => {
	it('is the text of the first heading carrying {{title}}', () => {
		expect(titleHeading('# Intro\n\n# {{title}} {{date}}\n\n## Notes\n')).toBe('{{title}} {{date}}');
	});

	it('is null without one, and skips frontmatter', () => {
		expect(titleHeading('# Intro\n')).toBeNull();
		expect(titleHeading('---\n# {{title}}: x\n---\n')).toBeNull();
	});
});
