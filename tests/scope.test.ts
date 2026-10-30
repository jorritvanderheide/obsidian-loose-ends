import { describe, expect, it } from 'vitest';
import { inScope } from '../src/core/scope';

describe('inScope', () => {
	it('takes in the whole vault when the notes folder is empty', () => {
		const settings = { notesFolder: '', templateFolder: 'Templates' };
		expect(inScope('Idea.md', settings)).toBe(true);
		expect(inScope('Projects/Idea.md', settings)).toBe(true);
	});

	it('takes in only the notes folder when one is set, matched as a whole folder', () => {
		const settings = { notesFolder: 'Notes/', templateFolder: 'Templates' };
		expect(inScope('Notes/Idea.md', settings)).toBe(true);
		expect(inScope('Notes/Deep/Idea.md', settings)).toBe(true);
		expect(inScope('NotesExtra/Idea.md', settings)).toBe(false);
		expect(inScope('Literature/Paper.md', settings)).toBe(false);
	});

	// The default settings, which is how the sweep came to write the unfiled
	// tag into every template.
	it('leaves out the template folder when the notes folder is the whole vault', () => {
		const settings = { notesFolder: '', templateFolder: 'Templates' };
		expect(inScope('Templates/Default.md', settings)).toBe(false);
		expect(inScope('Templates/Meetings/Weekly.md', settings)).toBe(false);
		expect(inScope('Templates.md', settings)).toBe(true);
		expect(inScope('TemplatesOld/Default.md', settings)).toBe(true);
	});

	it('leaves out a template folder inside the notes folder', () => {
		const settings = { notesFolder: 'Notes', templateFolder: '/Notes/Templates/' };
		expect(inScope('Notes/Templates/Default.md', settings)).toBe(false);
		expect(inScope('Notes/Idea.md', settings)).toBe(true);
	});

	it('leaves nothing out when the template folder is empty', () => {
		expect(inScope('Idea.md', { notesFolder: '', templateFolder: '' })).toBe(true);
	});
});
