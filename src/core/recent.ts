// The order things were last picked in, so the usual answer is the first one.
//
// Used for templates and for the values of every axis. Only ever an order:
// nothing is left out because it was never picked.

/**
 * What was picked before, read back from wherever it was kept.
 *
 * Anything that is not a list of strings reads as no history, which only costs
 * the order, never a note.
 */
export function readRecent(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

/**
 * The choices with the most recently picked first, so the last one picked is
 * the one Enter takes. Choices never picked keep their order after those.
 */
export function byRecent<T>(items: T[], key: (item: T) => string, recent: readonly string[]): T[] {
	const rank = (item: T) => {
		const index = recent.indexOf(key(item));
		return index === -1 ? recent.length : index;
	};
	return items
		.map((item, index) => ({ item, index }))
		.sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
		.map(({ item }) => item);
}

/**
 * The history after a pick: the pick first, then what came before it.
 *
 * Only what is still on offer is kept, so a template or value deleted or renamed
 * drops out rather than the list growing for ever.
 */
export function rememberPick(recent: readonly string[], picked: string, offered: readonly string[]): string[] {
	return [picked, ...recent.filter((key) => key !== picked && offered.includes(key))];
}
