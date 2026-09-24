// What "filed" means, which is the whole product.
//
// A note is filed when every axis you require has an answer on it. That is not
// stored: it is read off the note's own tags each time it is asked. The axis
// this replaces stored `inbox` and `filed` alongside the answers themselves,
// which is a second copy of a fact that was already there, and a second copy is
// a thing that can come to disagree with the first.
//
// What is stored is the mirror: one tag saying a note is unfiled, written only
// so a tag tree can show a folder of them. It is derived, never authoritative.
// When the mirror and the note disagree the note wins and the mirror is
// rewritten, never the other way round.

import { withTag, withoutTag } from './tags';
import type { Axis } from './vocabulary';
import { valueOf } from './vocabulary';

/** The axes a note still owes an answer on, in the order they were configured. */
export function missingAxes(axes: readonly Axis[], tags: readonly string[]): Axis[] {
	return axes.filter((axis) => valueOf(axis, tags) === null);
}

/**
 * Whether every required axis has been answered.
 *
 * No axes configured means every note is filed, which is the honest reading:
 * nothing has been asked for, so nothing is owed. It also means the plugin
 * writes no mirror at all until somebody says what they want filed by.
 */
export function isFiled(axes: readonly Axis[], tags: readonly string[]): boolean {
	return missingAxes(axes, tags).length === 0;
}

/**
 * The note's tags with the mirror brought in line with what they say.
 *
 * An empty `unfiledTag` writes no mirror and takes none off. A vault that never
 * turned it on has to be left exactly as found, including keeping no `tags` key
 * at all.
 */
export function withMirror(axes: readonly Axis[], tags: readonly string[], unfiledTag: string): string[] {
	if (unfiledTag === '') return [...tags];
	return isFiled(axes, tags) ? withoutTag(tags, unfiledTag) : withTag(tags, unfiledTag);
}

/**
 * Whether the mirror already says what the note says.
 *
 * The guard on every write. A listener that rewrote a note on each metadata
 * change would trigger itself, so nothing is written unless this is false.
 */
export function mirrorIsCurrent(axes: readonly Axis[], tags: readonly string[], unfiledTag: string): boolean {
	if (unfiledTag === '') return true;
	return tags.includes(unfiledTag) === !isFiled(axes, tags);
}
