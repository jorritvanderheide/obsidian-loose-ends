import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, readAxes, SETTINGS_VERSION } from '../src/core/settings';

describe('readAxes', () => {
	it('reads a well formed axis', () => {
		expect(readAxes([{ namespace: 'domain', values: ['phd', 'vault'] }])).toEqual([
			{ namespace: 'domain', values: ['phd', 'vault'] },
		]);
	});

	// An axis nobody can answer would make every note unfiled for ever, with no
	// way out of it from the interface.
	it('drops an axis with no values', () => {
		expect(readAxes([{ namespace: 'domain', values: [] }])).toEqual([]);
	});

	it('drops an axis with no namespace', () => {
		expect(readAxes([{ namespace: '  ', values: ['a'] }])).toEqual([]);
	});

	it('drops a duplicate namespace, keeping the first', () => {
		const axes = readAxes([
			{ namespace: 'domain', values: ['phd'] },
			{ namespace: 'domain', values: ['other'] },
		]);
		expect(axes).toEqual([{ namespace: 'domain', values: ['phd'] }]);
	});

	it('normalises the namespace and de-duplicates values', () => {
		expect(readAxes([{ namespace: '#domain/', values: ['phd', 'phd', ' vault '] }])).toEqual([
			{ namespace: 'domain', values: ['phd', 'vault'] },
		]);
	});

	it('reads junk as no axes', () => {
		expect(readAxes(undefined)).toEqual([]);
		expect(readAxes('domain')).toEqual([]);
		expect(readAxes([null, 3])).toEqual([]);
	});
});

describe('loadSettings', () => {
	it('falls back to defaults for anything missing', () => {
		expect(loadSettings({})).toEqual({ ...DEFAULT_SETTINGS, version: SETTINGS_VERSION });
	});

	it('reads junk as defaults rather than throwing', () => {
		expect(loadSettings(null)).toEqual({ ...DEFAULT_SETTINGS, version: SETTINGS_VERSION });
	});

	it('strips a hash from the mirror tag', () => {
		expect(loadSettings({ unfiledTag: '#status/unfiled' }).unfiledTag).toBe('status/unfiled');
	});

	it('keeps what was saved', () => {
		const saved = loadSettings({ notesFolder: 'Notes', templateFolder: 'T', unfiledTag: 'status/unfiled' });
		expect(saved.notesFolder).toBe('Notes');
		expect(saved.templateFolder).toBe('T');
	});
});
