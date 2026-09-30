import { describe, expect, it } from 'vitest';
import {
	dateIn,
	datesName,
	fillTemplate,
	isoDate,
	isTemplate,
	makeNote,
	placeCursor,
	STARTER_TEMPLATE,
	templateName,
} from '../src/core/template';

describe('isTemplate', () => {
	it('is a markdown file directly in the template folder', () => {
		expect(isTemplate('Templates/Notes/MOC.md', 'Templates/Notes')).toBe(true);
		expect(isTemplate('Templates/Notes/MOC.md', 'Templates/Notes/')).toBe(true);
	});

	it('is not one in a subfolder, in another folder, or of another kind', () => {
		expect(isTemplate('Templates/Notes/Old/MOC.md', 'Templates/Notes')).toBe(false);
		expect(isTemplate('Templates/NotesExtra/MOC.md', 'Templates/Notes')).toBe(false);
		expect(isTemplate('Notes/MOC.md', 'Templates/Notes')).toBe(false);
		expect(isTemplate('Templates/Notes/Diagram.canvas', 'Templates/Notes')).toBe(false);
	});

	it('is nothing when there is no template folder', () => {
		expect(isTemplate('MOC.md', '')).toBe(false);
	});
});

describe('fillTemplate', () => {
	it('puts the title in', () => {
		expect(fillTemplate('# {{title}}', 'Hanna', '2026-09-30')).toBe('# Hanna');
	});

	it('does not mind case or spacing', () => {
		expect(fillTemplate('{{TITLE}} {{ title }}', 'X', '2026-09-30')).toBe('X X');
	});

	it('replaces every occurrence', () => {
		expect(fillTemplate('{{title}}/{{title}}', 'X', '2026-09-30')).toBe('X/X');
	});

	it('leaves a template naming no placeholder alone', () => {
		expect(fillTemplate('---\ntags:\n  - type/living\n---\n', 'X', '2026-09-30')).toBe('---\ntags:\n  - type/living\n---\n');
	});
});

describe('templateName', () => {
	it('is the basename without the extension', () => {
		expect(templateName('Templates/Notes/MOC.md')).toBe('MOC');
		expect(templateName('MOC.md')).toBe('MOC');
	});
});

describe('placeCursor', () => {
	it('takes the placeholder out and counts from the end', () => {
		expect(placeCursor('# A\n\n{{cursor}}\n\n## B\n')).toEqual({ text: '# A\n\n\n\n## B\n', fromEnd: 7 });
	});

	it('does not mind case or spacing', () => {
		expect(placeCursor('a{{ Cursor }}b')).toEqual({ text: 'ab', fromEnd: 1 });
	});

	it('uses the first and removes the rest', () => {
		expect(placeCursor('a{{cursor}}b{{cursor}}c')).toEqual({ text: 'abc', fromEnd: 2 });
	});

	it('survives a frontmatter change above it', () => {
		const { text, fromEnd } = placeCursor('---\ntags: []\n---\nX{{cursor}}Y');
		const edited = `---\ntags:\n  - status/unfiled\n---\n${text.slice(text.indexOf('X'))}`;
		expect(edited.slice(edited.length - (fromEnd ?? 0))).toBe('Y');
	});

	it('is null without a placeholder', () => {
		expect(placeCursor('plain')).toEqual({ text: 'plain', fromEnd: null });
	});
});

describe('STARTER_TEMPLATE', () => {
	it('opens under the heading, a blank line down', () => {
		const { text, fromEnd } = placeCursor(fillTemplate(STARTER_TEMPLATE.text, 'Hanna', '2026-09-30'));
		expect(text).toBe('\n# Hanna\n\n');
		expect(fromEnd).toBe(0);
	});
});

describe('fillTemplate and {{date}}', () => {
	it('puts the date in, whatever the case and spacing', () => {
		expect(fillTemplate('date: {{date}}\n{{ DATE }}', 'X', '2026-09-30')).toBe('date: 2026-09-30\n2026-09-30');
	});
});

describe('isoDate', () => {
	it('writes a day as YYYY-MM-DD in local time, padded', () => {
		expect(isoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
		expect(isoDate(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
	});
});

describe('dateIn', () => {
	it('finds a date standing on its own in a name', () => {
		expect(dateIn('Hanna 2026-10-07')).toBe('2026-10-07');
		expect(dateIn('2026-10-07 Hanna')).toBe('2026-10-07');
	});

	it('finds nothing in a name without one, or in a longer run of digits', () => {
		expect(dateIn('Hanna')).toBeNull();
		expect(dateIn('Month 2026-10')).toBeNull();
		expect(dateIn('Build 12026-10-07')).toBeNull();
		expect(dateIn('v2026-10-07-1')).toBeNull();
	});
});

describe('datesName', () => {
	it('is true when the title heading carries {{date}}', () => {
		expect(datesName('# {{title}} {{date}}\n')).toBe(true);
		expect(datesName('---\ntags:\n  - type/record\n---\n\n# {{ Title }} {{ Date }}\n')).toBe(true);
	});

	it('is false for a title heading without it, or a date elsewhere', () => {
		expect(datesName('# {{title}}\n\ndate: {{date}}\n')).toBe(false);
		expect(datesName('# Notes {{date}}\n')).toBe(false);
		expect(datesName('no headings at all')).toBe(false);
	});

	it('is not fooled by a heading-like line in frontmatter or a code fence', () => {
		expect(datesName('---\n# {{title}} {{date}}: x\n---\n\n# {{title}}\n')).toBe(false);
		expect(datesName('```\n# {{title}} {{date}}\n```\n\n# {{title}}\n')).toBe(false);
	});
});

describe('makeNote', () => {
	const meeting = '---\ntags:\n  - type/record\n---\n\n# {{title}} {{date}}\n\n{{cursor}}\n';

	it('dates the name when the title heading asks for it', () => {
		const note = makeNote(meeting, 'Hanna', '2026-09-30');
		expect(note.name).toBe('Hanna 2026-09-30');
		expect(note.text).toContain('# Hanna 2026-09-30\n');
	});

	it('uses a typed date instead of today, without writing it twice', () => {
		const note = makeNote(meeting, 'Hanna 2026-10-07', '2026-09-30');
		expect(note.name).toBe('Hanna 2026-10-07');
		expect(note.text).toContain('# Hanna 2026-10-07\n');
	});

	it('keeps the typed name for a template that does not date it', () => {
		const note = makeNote('# {{title}}\n\ncreated {{date}}\n', 'Hanna 2026-10-07', '2026-09-30');
		expect(note.name).toBe('Hanna 2026-10-07');
		expect(note.text).toBe('# Hanna 2026-10-07\n\ncreated 2026-10-07\n');
	});

	it('keeps the typed name, trimmed, for a template with no title heading', () => {
		expect(makeNote('just text {{date}}', '  Hanna  ', '2026-09-30')).toEqual({
			name: 'Hanna',
			text: 'just text 2026-09-30',
		});
	});

	it('leaves a question template named as typed', () => {
		const question = '---\ntitle: "{{title}}?"\n---\n\n# {{title}}?\n';
		expect(makeNote(question, 'Why sign', '2026-09-30').name).toBe('Why sign');
	});
});

describe('names with $ in them', () => {
	it('keeps $ patterns in a typed name literal, in the text and in the name', () => {
		expect(fillTemplate('# {{title}}', 'Budget $& plan', '2026-09-30')).toBe('# Budget $& plan');
		expect(makeNote('# {{title}} {{date}}\n', "Price $' tiers", '2026-09-30').name).toBe("Price $' tiers 2026-09-30");
	});
});

describe('dateIn, at the start of a name', () => {
	it('finds a date that opens the name, as well as one after a space', () => {
		expect(dateIn('2026-10-07')).toBe('2026-10-07');
		expect(makeNote('# {{title}} {{date}}\n', '2026-10-07 Hanna', '2026-09-30').name).toBe('Hanna 2026-10-07');
	});
});
