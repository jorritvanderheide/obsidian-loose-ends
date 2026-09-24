// Reading and writing the `tags` frontmatter key, which arrives in more shapes
// than it is ever written in.

/**
 * The tag list on a note, normalised to an array of bare tags.
 *
 * Obsidian accepts a list, a single string, and a comma or space separated
 * string, and a vault edited by hand holds all three. A leading `#` is dropped:
 * that is how a tag is written in the body, not in frontmatter, and a note
 * carrying `#domain/phd` there means the same thing.
 */
export function readTags(value: unknown): string[] {
	const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\s]+/) : [];
	const out: string[] = [];
	for (const entry of raw) {
		if (typeof entry !== 'string') continue;
		const tag = entry.trim().replace(/^#+/, '');
		if (tag !== '' && !out.includes(tag)) out.push(tag);
	}
	return out;
}

/**
 * The list with `tag` on it, sorted ascending.
 *
 * Sorted because the Linter sorts tag arrays ascending on save anyway, so
 * writing them in any other order only means the next save shows a diff that
 * nobody made.
 */
export function withTag(tags: readonly string[], tag: string): string[] {
	if (tags.includes(tag)) return [...tags];
	return [...tags, tag].sort();
}

/** The list without `tag`. */
export function withoutTag(tags: readonly string[], tag: string): string[] {
	return tags.filter((entry) => entry !== tag);
}

/**
 * The list without anything under `namespace/`, and without the bare namespace.
 *
 * What answering an axis a second time has to do first, so that choosing
 * `domain/personal` on a note that said `domain/phd` leaves one answer rather
 * than two.
 */
export function withoutNamespace(tags: readonly string[], namespace: string): string[] {
	const prefix = `${namespace}/`;
	return tags.filter((tag) => tag !== namespace && !tag.startsWith(prefix));
}

/** The list with one axis answered: every older answer off, the new one on. */
export function withValue(tags: readonly string[], namespace: string, value: string): string[] {
	return withTag(withoutNamespace(tags, namespace), `${namespace}/${value}`);
}
