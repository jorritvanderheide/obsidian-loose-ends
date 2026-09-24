import { describe, expect, it } from 'vitest';
import { fillTemplate, placeCursor, STARTER_TEMPLATE, templateName } from '../src/core/template';

describe('fillTemplate', () => {
	it('puts the title in', () => {
		expect(fillTemplate('# {{title}}', 'Hanna')).toBe('# Hanna');
	});

	it('does not mind case or spacing', () => {
		expect(fillTemplate('{{TITLE}} {{ title }}', 'X')).toBe('X X');
	});

	it('replaces every occurrence', () => {
		expect(fillTemplate('{{title}}/{{title}}', 'X')).toBe('X/X');
	});

	it('leaves a template naming no placeholder alone', () => {
		expect(fillTemplate('---\ntags:\n  - type/living\n---\n', 'X')).toBe('---\ntags:\n  - type/living\n---\n');
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
		const { text, fromEnd } = placeCursor(fillTemplate(STARTER_TEMPLATE.text, 'Hanna'));
		expect(text).toBe('\n# Hanna\n\n');
		expect(fromEnd).toBe(0);
	});
});
