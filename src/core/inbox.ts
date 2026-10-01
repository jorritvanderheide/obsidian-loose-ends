// What the inbox block lists: the notes still owing an answer, and the ones
// that stopped owing one lately.
//
// Filed is read off the tags here as everywhere else. The one thing kept is
// when a note was filed, because no tag says that, and it only ever decides
// whether a filed note is shown as recent. It never decides that one is filed.

import { isFiled, missingAxes } from './filing';
import type { Axis } from './vocabulary';

/** A note as the inbox needs it, read off the vault by the caller. */
export interface InboxNote {
	path: string;
	title: string;
	tags: string[];
	/** When the file was made, in milliseconds. */
	created: number;
}

/** That a note was filed, and when, in milliseconds. */
export interface Filing {
	path: string;
	at: number;
}

/** How long a filed note stays under Recently filed. */
export const RECENT_FOR = 7 * 24 * 60 * 60 * 1000;

/** How many unfiled notes are shown before "and N more". */
export const INBOX_ROWS = 10;

/**
 * What the inbox block calls the notes still owing an answer.
 *
 * The unfiled tag's own name, so the block and a tag tree call the same notes
 * the same thing: its last segment, capitalised, because a tag like
 * `status/unfiled` is an address and the block wants a word. "Unfiled" when
 * there is no tag, or nothing left of it.
 */
export function inboxLabel(unfiledTag: string): string {
	const word = unfiledTag.trim().replace(/^#+/, '').split('/').pop()?.trim() ?? '';
	return word === '' ? 'Unfiled' : word.charAt(0).toUpperCase() + word.slice(1);
}

/** The notes still owing an answer, newest first, with what each one owes. */
export function unfiledNotes(notes: readonly InboxNote[], axes: readonly Axis[]): { note: InboxNote; missing: Axis[] }[] {
	return notes
		.map((note) => ({ note, missing: missingAxes(axes, note.tags) }))
		.filter((entry) => entry.missing.length > 0)
		.sort((a, b) => b.note.created - a.note.created || a.note.title.localeCompare(b.note.title));
}

/**
 * The notes filed lately, most recent first.
 *
 * A note has to be filed now as well as logged: one that lost an answer again
 * is back in the inbox, and showing it here too would be two answers to one
 * question.
 */
export function recentlyFiled(
	notes: readonly InboxNote[],
	axes: readonly Axis[],
	log: readonly Filing[],
	now: number,
): { note: InboxNote; at: number }[] {
	const byPath = new Map(notes.map((note) => [note.path, note]));
	const out: { note: InboxNote; at: number }[] = [];
	for (const { path, at } of log) {
		const note = byPath.get(path);
		if (note && now - at < RECENT_FOR && isFiled(axes, note.tags)) out.push({ note, at });
	}
	return out.sort((a, b) => b.at - a.at);
}

/** What an unfiled note still owes, for its tooltip. */
export function owedLabel(missing: readonly Axis[]): string {
	const names = missing.map((axis) => axis.namespace);
	const last = names.pop() ?? '';
	const list = names.length === 0 ? last : `${names.join(', ')} and ${last}`;
	return `No ${list} yet`;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const AGO = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * When a recently filed note was filed, for its tooltip.
 *
 * In English, like the rest of the block. Nothing under Recently filed is
 * older than `RECENT_FOR`, so days are the largest unit it needs.
 */
export function filedLabel(at: number, now: number): string {
	const ago = Math.max(0, now - at);
	if (ago < MINUTE) return 'Filed just now';
	if (ago < HOUR) return `Filed ${AGO.format(-Math.floor(ago / MINUTE), 'minute')}`;
	if (ago < DAY) return `Filed ${AGO.format(-Math.floor(ago / HOUR), 'hour')}`;
	return `Filed ${AGO.format(-Math.floor(ago / DAY), 'day')}`;
}

/**
 * The log as it was kept, with anything unreadable dropped. Losing it costs
 * the Recently filed section and nothing else.
 */
export function readFilings(value: unknown): Filing[] {
	if (!Array.isArray(value)) return [];
	return value.filter(
		(entry): entry is Filing =>
			typeof entry === 'object' &&
			entry !== null &&
			typeof (entry as Filing).path === 'string' &&
			typeof (entry as Filing).at === 'number',
	);
}

/** The log after a note was filed: that note once, and nothing past its time. */
export function withFiling(log: readonly Filing[], path: string, at: number): Filing[] {
	return [{ path, at }, ...log.filter((entry) => entry.path !== path && at - entry.at < RECENT_FOR)];
}

/** The log after a note was deleted, so a new note made at its path does not inherit its filing. */
export function withoutFiling(log: readonly Filing[], path: string): Filing[] {
	return log.filter((entry) => entry.path !== path);
}

/** The log after a note was renamed, so its filing follows it. */
export function withRename(log: readonly Filing[], from: string, to: string): Filing[] {
	return log.map((entry) => (entry.path === from ? { ...entry, path: to } : entry));
}
