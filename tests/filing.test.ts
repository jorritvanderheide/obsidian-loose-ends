import { describe, expect, it } from 'vitest';
import { isFiled, mirrorIsCurrent, missingAxes, withMirror } from '../src/core/filing';
import type { Axis } from '../src/core/vocabulary';

const domain: Axis = { namespace: 'domain', values: ['phd', 'vault', 'personal'] };
const source: Axis = { namespace: 'source', values: ['ai', 'meeting', 'own'] };
const axes = [domain, source];
const UNFILED = 'status/unfiled';

describe('missingAxes', () => {
	it('lists what a note still owes, in configured order', () => {
		expect(missingAxes(axes, []).map((a) => a.namespace)).toEqual(['domain', 'source']);
	});

	it('drops an axis once it is answered', () => {
		expect(missingAxes(axes, ['domain/phd']).map((a) => a.namespace)).toEqual(['source']);
	});

	it('does not count a nested tag as an answer', () => {
		expect(missingAxes(axes, ['domain/phd/wp1']).map((a) => a.namespace)).toEqual(['domain', 'source']);
	});
});

describe('isFiled', () => {
	it('is true when every axis is answered', () => {
		expect(isFiled(axes, ['domain/phd', 'source/ai'])).toBe(true);
	});

	it('is false while one is outstanding', () => {
		expect(isFiled(axes, ['domain/phd'])).toBe(false);
	});

	// Nothing has been asked for, so nothing is owed.
	it('is true for every note when no axes are configured', () => {
		expect(isFiled([], [])).toBe(true);
	});
});

describe('withMirror', () => {
	it('adds the mirror to an unfiled note', () => {
		expect(withMirror(axes, ['domain/phd'], UNFILED)).toEqual(['domain/phd', UNFILED]);
	});

	it('takes the mirror off once the note is filed', () => {
		expect(withMirror(axes, ['domain/phd', 'source/ai', UNFILED], UNFILED)).toEqual(['domain/phd', 'source/ai']);
	});

	// A vault that never turned the mirror on must be left exactly as found.
	it('writes and removes nothing when no mirror tag is set', () => {
		expect(withMirror(axes, ['domain/phd'], '')).toEqual(['domain/phd']);
		expect(withMirror(axes, [UNFILED], '')).toEqual([UNFILED]);
	});
});

describe('mirrorIsCurrent', () => {
	// The guard on every write. Without it the listener rewrites on its own
	// write and triggers itself for ever.
	it('is true when the mirror already agrees with the note', () => {
		expect(mirrorIsCurrent(axes, ['domain/phd', UNFILED], UNFILED)).toBe(true);
		expect(mirrorIsCurrent(axes, ['domain/phd', 'source/ai'], UNFILED)).toBe(true);
	});

	it('is false when the note has been answered but still carries the mirror', () => {
		expect(mirrorIsCurrent(axes, ['domain/phd', 'source/ai', UNFILED], UNFILED)).toBe(false);
	});

	it('is false when the note is unfiled and carries no mirror', () => {
		expect(mirrorIsCurrent(axes, ['domain/phd'], UNFILED)).toBe(false);
	});

	it('is always true when no mirror tag is set', () => {
		expect(mirrorIsCurrent(axes, ['domain/phd'], '')).toBe(true);
	});
});
