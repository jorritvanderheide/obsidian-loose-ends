// An axis the vault wants an answer on, and the one place a value is read off a
// note's tags.
//
// Comparison is exact, never `startsWith`. The automation this replaces compared
// with `startsWith`, so `domain/phd/wp1` passed validation while the vocabulary
// only ever knew flat values and no suggester would offer a nested one. The only
// way in was typing frontmatter by hand, which made the first typo a matter of
// time and one that would not show up until the tag tree came apart.

export interface Axis {
	/** The tag namespace, with no slashes of its own: `domain`, `source`. */
	namespace: string;
	/** Every value the axis accepts. The suggester offers recent picks first, then these in order. */
	values: string[];
}

/** The tag an axis and a value make: `domain` and `phd` give `domain/phd`. */
export function tagFor(namespace: string, value: string): string {
	return `${namespace}/${value}`;
}

/**
 * The value this axis has on a note, or null when it has none.
 *
 * Exact: a tag answers the axis when it is the namespace, a slash, and one of
 * the known values, with nothing after it. `domain/phd/wp1` does not answer
 * `domain`, and reading it as though it did is what hid the old bug.
 */
export function valueOf(axis: Axis, tags: readonly string[]): string | null {
	for (const value of axis.values) {
		if (tags.includes(tagFor(axis.namespace, value))) return value;
	}
	return null;
}

/** Whether this axis knows a value, compared exactly. */
export function isKnown(axis: Axis, value: string): boolean {
	return axis.values.includes(value);
}

/**
 * Tags under this namespace that the axis does not know.
 *
 * What a nested value or an old spelling looks like from here. Reported rather
 * than corrected: a tag somebody typed is a tag somebody meant, and guessing
 * which known value they meant is how a filing system loses data quietly.
 */
export function strayTags(axis: Axis, tags: readonly string[]): string[] {
	const prefix = `${axis.namespace}/`;
	const known = new Set(axis.values.map((value) => tagFor(axis.namespace, value)));
	return tags.filter((tag) => tag.startsWith(prefix) && !known.has(tag));
}

/** A namespace as it is stored: no `#`, no slashes, no surrounding space. */
export function normaliseNamespace(raw: string): string {
	return raw.trim().replace(/^#+/, '').replace(/\/+$/, '').replace(/\s+/g, '-');
}
