// The one place `any` is allowed in, and where it stops.
//
// `processFrontMatter` hands its callback an `any`, which spreads untyped
// property access into every caller that touches frontmatter. Narrowed here so
// the rest of the plugin works with a plain object it can reason about.

import type { App, TFile } from 'obsidian';

export type Frontmatter = Record<string, unknown>;

/** Edit a note's frontmatter as a plain object. */
export function editFrontmatter(app: App, file: TFile, edit: (frontmatter: Frontmatter) => void): Promise<void> {
	return app.fileManager.processFrontMatter(file, (frontmatter: Frontmatter) => {
		edit(frontmatter);
	});
}

/** The `tags` value off a metadata cache entry, without reaching through `any`. */
export function cachedTags(app: App, file: TFile): unknown {
	const frontmatter: Frontmatter | undefined = app.metadataCache.getFileCache(file)?.frontmatter;
	return frontmatter?.tags;
}
