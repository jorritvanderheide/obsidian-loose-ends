import { describe, expect, it } from 'vitest';
import { byRecent, readRecent, rememberPick } from '../src/core/recent';

describe('readRecent', () => {
	it('keeps the strings of a list', () => {
		expect(readRecent(['a', 1, 'b'])).toEqual(['a', 'b']);
	});

	it('reads anything else as no history', () => {
		expect(readRecent(null)).toEqual([]);
		expect(readRecent('a')).toEqual([]);
		expect(readRecent({ 0: 'a' })).toEqual([]);
	});
});

describe('byRecent', () => {
	const id = (item: string) => item;

	it('puts the most recently picked first', () => {
		expect(byRecent(['', 'A', 'B', 'C'], id, ['C', 'A'])).toEqual(['C', 'A', '', 'B']);
	});

	it('keeps the given order when nothing was picked', () => {
		expect(byRecent(['', 'A', 'B'], id, [])).toEqual(['', 'A', 'B']);
	});

	it('ignores history for choices no longer offered', () => {
		expect(byRecent(['A', 'B'], id, ['gone', 'B'])).toEqual(['B', 'A']);
	});
});

describe('rememberPick', () => {
	it('moves the pick to the front', () => {
		expect(rememberPick(['A', 'B', 'C'], 'B', ['A', 'B', 'C'])).toEqual(['B', 'A', 'C']);
	});

	it('adds a first pick', () => {
		expect(rememberPick([], 'A', ['A', 'B'])).toEqual(['A']);
	});

	it('drops what is no longer offered', () => {
		expect(rememberPick(['gone', 'A'], 'B', ['A', 'B'])).toEqual(['B', 'A']);
	});
});
