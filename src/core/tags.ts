// Reading and writing the `tags` frontmatter key, which arrives in more shapes
// than it is ever written in.

/**
 * The tag list on a note, normalised to an array of bare tags.
 *
 * Obsidian accepts a list, a single string, and a comma or space separated
 * string, and a vault edited by hand holds all three. A leading `#` is dropped:
 * that is how a tag is written in the body, not in frontmatter, and a note
 * carrying `#domain/phd` there means the same thing.
 *
 * A number or a boolean is read as the text it was written as, because YAML
 * reads `tags: [2024, project]` as a number and a string, and the list read
 * here is the list written back: an entry left out here is gone from the note.
 */
export function readTags(value: unknown): string[] {
	const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\s]+/) : [value];
	const out: string[] = [];
	for (const entry of raw) {
		const text = scalarText(entry);
		if (text === null) continue;
		const tag = text.trim().replace(/^#+/, '');
		if (tag !== '' && !out.includes(tag)) out.push(tag);
	}
	return out;
}

/** A scalar's text, or null for an empty entry or one that holds more than text. */
function scalarText(entry: unknown): string | null {
	if (typeof entry === 'string') return entry;
	if (typeof entry === 'number' || typeof entry === 'boolean') return String(entry);
	return null;
}

/**
 * Whether `readTags` takes in everything in this `tags` value, so writing its
 * list back loses nothing.
 *
 * False when an entry holds more than text, such as `- status: done` typed
 * into the list, which YAML reads as an object. There is no tag to read off it
 * and no way to write it back as one, so the note is left as it is.
 */
export function canRewriteTags(value: unknown): boolean {
	const entries: unknown[] = Array.isArray(value) ? value : [value];
	return entries.every((entry) => entry === null || entry === undefined || scalarText(entry) !== null);
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
