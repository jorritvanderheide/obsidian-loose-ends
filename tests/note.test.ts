import { describe, expect, it } from 'vitest';
import { cleanFolder, notePath, titleMessage, titleProblem } from '../src/core/note';

const nothingExists = () => false;

describe('notePath', () => {
	it('puts a note in the folder', () => {
		expect(notePath('Notes', 'Hanna')).toBe('Notes/Hanna.md');
	});

	it('puts a note at the root when no folder is set', () => {
		expect(notePath('', 'Hanna')).toBe('Hanna.md');
	});

	it('tolerates slashes around the folder', () => {
		expect(notePath('/Notes/', 'Hanna')).toBe('Notes/Hanna.md');
	});
});

describe('titleProblem', () => {
	it('accepts a plain title', () => {
		expect(titleProblem('Hanna', 'Notes', nothingExists)).toBeNull();
	});

	it('rejects an empty or blank title', () => {
		expect(titleProblem('', 'Notes', nothingExists)).toBe('empty');
		expect(titleProblem('   ', 'Notes', nothingExists)).toBe('empty');
	});

	it('rejects characters a file name cannot hold', () => {
		expect(titleProblem('a/b', 'Notes', nothingExists)).toBe('illegal');
		expect(titleProblem('a:b', 'Notes', nothingExists)).toBe('illegal');
	});

	it('rejects a title already taken, checked at the path it would get', () => {
		const exists = (path: string) => path === 'Notes/Hanna.md';
		expect(titleProblem('Hanna', 'Notes', exists)).toBe('exists');
		expect(titleProblem('Hanna', 'Other', exists)).toBeNull();
	});

	it('has a message for every problem it can report', () => {
		for (const problem of ['empty', 'illegal', 'exists'] as const) {
			expect(titleMessage(problem).length).toBeGreaterThan(0);
		}
	});
});

describe('cleanFolder', () => {
	it('trims slashes and space', () => {
		expect(cleanFolder('  /Notes/  ')).toBe('Notes');
		expect(cleanFolder('/')).toBe('');
	});
});
