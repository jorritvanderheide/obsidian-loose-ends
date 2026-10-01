import { describe, expect, it } from 'vitest';
import { isKnown, normaliseNamespace, normaliseValue, questionFor, strayTags, tagFor, valueOf, type Axis } from '../src/core/vocabulary';

const domain: Axis = { namespace: 'domain', values: ['phd', 'vault', 'personal'] };

describe('valueOf', () => {
	it('finds the value a note carries', () => {
		expect(valueOf(domain, ['domain/phd', 'source/ai'])).toBe('phd');
	});

	it('is null when the axis is unanswered', () => {
		expect(valueOf(domain, ['source/ai'])).toBeNull();
	});

	// The bug this plugin exists downstream of: `startsWith` accepted a nested
	// value the vocabulary never knew, so a typo lived until the tree came apart.
	it('does not read a nested tag as an answer', () => {
		expect(valueOf(domain, ['domain/phd/wp1'])).toBeNull();
	});

	it('does not read the bare namespace as an answer', () => {
		expect(valueOf(domain, ['domain'])).toBeNull();
	});

	it('does not read a value it does not know', () => {
		expect(valueOf(domain, ['domain/coding'])).toBeNull();
	});

	it('offers values in configured order, not alphabetical', () => {
		expect(valueOf(domain, ['domain/personal', 'domain/phd'])).toBe('phd');
	});
});

describe('strayTags', () => {
	it('reports nested and unknown values without touching them', () => {
		expect(strayTags(domain, ['domain/phd', 'domain/phd/wp1', 'domain/coding', 'source/ai'])).toEqual([
			'domain/phd/wp1',
			'domain/coding',
		]);
	});

	it('is empty when every tag under the namespace is known', () => {
		expect(strayTags(domain, ['domain/phd', 'source/ai'])).toEqual([]);
	});
});

describe('questionFor', () => {
	it('asks plainly when nothing under the namespace is stray', () => {
		expect(questionFor(domain, ['domain/phd', 'source/ai'])).toBe('Which domain?');
	});

	it('names a stray tag, and says picking replaces it', () => {
		expect(questionFor(domain, ['domain/phd/wp1', 'source/ai'])).toBe(
			"Which domain? domain/phd/wp1 isn't one of its values, and picking one replaces it.",
		);
	});

	it('names every stray tag', () => {
		expect(questionFor(domain, ['domain/phd/wp1', 'domain/coding'])).toBe(
			"Which domain? domain/phd/wp1, domain/coding aren't among its values, and picking one replaces them.",
		);
	});
});

describe('tagFor and isKnown', () => {
	it('joins a namespace and value', () => {
		expect(tagFor('domain', 'phd')).toBe('domain/phd');
	});

	it('compares values exactly', () => {
		expect(isKnown(domain, 'phd')).toBe(true);
		expect(isKnown(domain, 'phd/wp1')).toBe(false);
		expect(isKnown(domain, 'PHD')).toBe(false);
	});
});

describe('normaliseNamespace', () => {
	it('strips hashes, trailing slashes and spaces', () => {
		expect(normaliseNamespace('  #domain/ ')).toBe('domain');
		expect(normaliseNamespace('my topic')).toBe('my-topic');
	});
});

describe('normaliseValue', () => {
	it('keeps a nested value nested', () => {
		expect(normaliseValue('phd/wp1')).toBe('phd/wp1');
	});

	it('strips slashes at either end and collapses doubled ones', () => {
		expect(normaliseValue(' /phd//wp1/ ')).toBe('phd/wp1');
		expect(normaliseValue('/')).toBe('');
	});
});
