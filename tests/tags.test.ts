import { describe, expect, it } from 'vitest';
import { canRewriteTags, readTags, withTag, withValue, withoutNamespace, withoutTag } from '../src/core/tags';

describe('readTags', () => {
	it('reads a list', () => {
		expect(readTags(['domain/phd', 'source/ai'])).toEqual(['domain/phd', 'source/ai']);
	});

	it('reads a comma or space separated string', () => {
		expect(readTags('domain/phd, source/ai')).toEqual(['domain/phd', 'source/ai']);
		expect(readTags('domain/phd source/ai')).toEqual(['domain/phd', 'source/ai']);
	});

	it('drops a leading hash, which is body syntax not frontmatter syntax', () => {
		expect(readTags(['#domain/phd'])).toEqual(['domain/phd']);
	});

	it('drops blanks and duplicates', () => {
		expect(readTags(['domain/phd', '', 'domain/phd', null])).toEqual(['domain/phd']);
	});

	// YAML reads `tags: [2024, project]` as a number and a string, and the list
	// read here is the list written back.
	it('keeps a number or a boolean, as the text it was written as', () => {
		expect(readTags([2024, 'project'])).toEqual(['2024', 'project']);
		expect(readTags([true, 'project'])).toEqual(['true', 'project']);
		expect(readTags(2024)).toEqual(['2024']);
	});

	it('reads nothing off an entry that holds more than text', () => {
		expect(readTags(['project', { status: 'done' }, ['link']])).toEqual(['project']);
	});

	it('reads a missing key as no tags', () => {
		expect(readTags(undefined)).toEqual([]);
		expect(readTags(null)).toEqual([]);
	});
});

describe('withTag', () => {
	it('adds and sorts ascending, the way the Linter would anyway', () => {
		expect(withTag(['type/living'], 'domain/phd')).toEqual(['domain/phd', 'type/living']);
	});

	it('leaves a tag that is already there', () => {
		expect(withTag(['domain/phd'], 'domain/phd')).toEqual(['domain/phd']);
	});
});

describe('withoutTag and withoutNamespace', () => {
	it('removes one tag', () => {
		expect(withoutTag(['a', 'b'], 'a')).toEqual(['b']);
	});

	it('removes the namespace, its values and its nested values', () => {
		expect(withoutNamespace(['domain', 'domain/phd', 'domain/phd/wp1', 'source/ai'], 'domain')).toEqual(['source/ai']);
	});
});

describe('withValue', () => {
	it('replaces an older answer rather than adding a second', () => {
		expect(withValue(['domain/phd', 'source/ai'], 'domain', 'personal')).toEqual(['domain/personal', 'source/ai']);
	});

	it('clears a nested stray while answering', () => {
		expect(withValue(['domain/phd/wp1'], 'domain', 'phd')).toEqual(['domain/phd']);
	});
});

describe('canRewriteTags', () => {
	it('is true for every shape readTags takes in whole', () => {
		expect(canRewriteTags(undefined)).toBe(true);
		expect(canRewriteTags(null)).toBe(true);
		expect(canRewriteTags('domain/phd, project')).toBe(true);
		expect(canRewriteTags(2024)).toBe(true);
		expect(canRewriteTags(['domain/phd', 2024, true, null])).toBe(true);
	});

	// `- status: done` typed into the list, or `[[a link]]`, which YAML reads
	// as a list inside the list. Writing the tags back would drop either.
	it('is false when an entry holds more than text', () => {
		expect(canRewriteTags(['project', { status: 'done' }])).toBe(false);
		expect(canRewriteTags([['a link']])).toBe(false);
		expect(canRewriteTags({ status: 'done' })).toBe(false);
	});
});
