// Settings are addresses, not opinions.
//
// A folder, a tag namespace, the values an axis accepts. Names this plugin
// would otherwise hardcode, where hardcoding one means it only ever works in
// the vault it was written in.
//
// What is not here is the loop: capture without classifying, then classify, and
// a tag that will not go away until you have. That is the product. Making it
// configurable would turn it into a rules engine that asks you to invent a
// filing system before you can use one, which is what Dataview already is.

import type { Axis } from './vocabulary';
import { normaliseNamespace } from './vocabulary';

/**
 * Stamped on every save, and bumped when a saved key is renamed or changes
 * meaning. Never for adding or removing one: an absent key falls back to its
 * default already, and a key nothing reads is dropped by the loader, which
 * builds a fresh object from the names it knows rather than editing the saved
 * one.
 */
export const SETTINGS_VERSION = 1;

export interface Settings {
	version: number;
	/** Where a new note is made. */
	notesFolder: string;
	/** Where the templates offered on create are read from. */
	templateFolder: string;
	/** The axes a note must answer before it counts as filed. */
	axes: Axis[];
	/**
	 * The one tag written on a note that has not answered them all.
	 *
	 * Derived from the note every time, so it is safe to delete by hand and it
	 * will come back. Empty writes none, for a vault that would rather query
	 * than browse. It exists because a tag tree can only show a folder for a tag
	 * that is actually on the note.
	 */
	unfiledTag: string;
}

export const DEFAULT_SETTINGS: Settings = {
	version: SETTINGS_VERSION,
	notesFolder: '',
	templateFolder: 'Templates',
	axes: [],
	unfiledTag: '',
};

function asString(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value.trim() : fallback;
}

/**
 * The axes on disk, with anything unusable dropped rather than repaired.
 *
 * An axis with no namespace or no values cannot be answered, so it would make
 * every note unfiled for ever with no way out of it. Dropping it is the failure
 * that can be seen; keeping it is the one that cannot.
 */
export function readAxes(value: unknown): Axis[] {
	if (!Array.isArray(value)) return [];
	const out: Axis[] = [];
	const seen = new Set<string>();
	for (const entry of value) {
		if (typeof entry !== 'object' || entry === null) continue;
		const raw = entry as Record<string, unknown>;
		const namespace = normaliseNamespace(asString(raw.namespace, ''));
		if (namespace === '' || seen.has(namespace)) continue;
		const values = Array.isArray(raw.values)
			? raw.values.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter((v) => v !== '')
			: [];
		if (values.length === 0) continue;
		seen.add(namespace);
		out.push({ namespace, values: [...new Set(values)] });
	}
	return out;
}

/** Settings as saved, read back into the shape the plugin expects. */
export function loadSettings(data: unknown): Settings {
	const raw = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
	return {
		version: SETTINGS_VERSION,
		notesFolder: asString(raw.notesFolder, DEFAULT_SETTINGS.notesFolder),
		templateFolder: asString(raw.templateFolder, DEFAULT_SETTINGS.templateFolder),
		axes: readAxes(raw.axes),
		unfiledTag: asString(raw.unfiledTag, DEFAULT_SETTINGS.unfiledTag).replace(/^#+/, ''),
	};
}
