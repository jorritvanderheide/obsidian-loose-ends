import { describe, expect, it } from 'vitest';
import { readTags, withTag, withValue, withoutNamespace, withoutTag } from '../src/core/tags';

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

	it('drops blanks, duplicates and non-strings', () => {
		expect(readTags(['domain/phd', '', 'domain/phd', 3, null])).toEqual(['domain/phd']);
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
