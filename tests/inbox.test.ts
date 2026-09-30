import { describe, expect, it } from 'vitest';
import {
	owedLabel,
	readFilings,
	RECENT_FOR,
	recentlyFiled,
	unfiledNotes,
	withFiling,
	withRename,
	type InboxNote,
} from '../src/core/inbox';
import type { Axis } from '../src/core/vocabulary';

const domain: Axis = { namespace: 'domain', values: ['phd', 'vault'] };
const source: Axis = { namespace: 'source', values: ['ai', 'own'] };
const axes = [domain, source];
const NOW = 1_000_000_000_000;

function note(title: string, tags: string[], created = 0): InboxNote {
	return { path: `Notes/${title}.md`, title, tags, created };
}

describe('unfiledNotes', () => {
	it('lists only notes still owing an answer, newest first', () => {
		const notes = [
			note('Old', [], 1),
			note('Filed', ['domain/phd', 'source/ai'], 3),
			note('New', ['domain/phd'], 2),
		];
		expect(unfiledNotes(notes, axes).map((entry) => entry.note.title)).toEqual(['New', 'Old']);
	});

	it('says what each one owes', () => {
		const [entry] = unfiledNotes([note('Half', ['source/own'])], axes);
		expect(entry?.missing.map((axis) => axis.namespace)).toEqual(['domain']);
	});

	it('does not count a nested tag as an answer', () => {
		expect(unfiledNotes([note('Nested', ['domain/phd/wp1', 'source/ai'])], axes)).toHaveLength(1);
	});

	it('is empty when no axes are configured', () => {
		expect(unfiledNotes([note('Any', [])], [])).toEqual([]);
	});
});

describe('recentlyFiled', () => {
	const filed = note('Filed', ['domain/phd', 'source/ai']);

	it('lists logged notes that are filed, most recent first', () => {
		const other = note('Other', ['domain/vault', 'source/own']);
		const log = [
			{ path: filed.path, at: NOW - 2000 },
			{ path: other.path, at: NOW - 1000 },
		];
		expect(recentlyFiled([filed, other], axes, log, NOW).map((entry) => entry.note.title)).toEqual(['Other', 'Filed']);
	});

	// Back in the inbox, so not here as well.
	it('leaves out a note that lost an answer again', () => {
		const lost = note('Lost', ['domain/phd']);
		expect(recentlyFiled([lost], axes, [{ path: lost.path, at: NOW }], NOW)).toEqual([]);
	});

	it('leaves out a filing older than the window', () => {
		expect(recentlyFiled([filed], axes, [{ path: filed.path, at: NOW - RECENT_FOR }], NOW)).toEqual([]);
	});

	it('leaves out a note that is gone', () => {
		expect(recentlyFiled([], axes, [{ path: filed.path, at: NOW }], NOW)).toEqual([]);
	});
});

describe('owedLabel', () => {
	it('names one axis', () => {
		expect(owedLabel([domain])).toBe('No domain yet');
	});

	it('names several in order', () => {
		expect(owedLabel([domain, source, { namespace: 'type', values: ['x'] }])).toBe('No domain, source and type yet');
	});
});

describe('readFilings', () => {
	it('reads junk as an empty log', () => {
		expect(readFilings(null)).toEqual([]);
		expect(readFilings('x')).toEqual([]);
	});

	it('drops entries it cannot read', () => {
		expect(readFilings([{ path: 'a.md', at: 1 }, { path: 'b.md' }, 3])).toEqual([{ path: 'a.md', at: 1 }]);
	});
});

describe('withFiling', () => {
	it('puts the note first, once', () => {
		const log = [
			{ path: 'a.md', at: NOW - 2 },
			{ path: 'b.md', at: NOW - 1 },
		];
		expect(withFiling(log, 'a.md', NOW)).toEqual([
			{ path: 'a.md', at: NOW },
			{ path: 'b.md', at: NOW - 1 },
		]);
	});

	it('drops filings past the window', () => {
		expect(withFiling([{ path: 'old.md', at: NOW - RECENT_FOR }], 'a.md', NOW)).toEqual([{ path: 'a.md', at: NOW }]);
	});
});

describe('withRename', () => {
	it('moves the filing with the note', () => {
		expect(withRename([{ path: 'a.md', at: 1 }], 'a.md', 'b.md')).toEqual([{ path: 'b.md', at: 1 }]);
	});
});
