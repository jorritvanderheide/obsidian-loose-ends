// Where a new note goes and what it may be called.

/** What Obsidian will not accept in a file name. */
const ILLEGAL = /[\\/:*?"<>|]/;

export type TitleProblem = 'empty' | 'illegal' | 'exists';

/** The folder path with any trailing slashes taken off. */
export function cleanFolder(folder: string): string {
	return folder.trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

/** The path a note with this title gets. */
export function notePath(folder: string, title: string): string {
	const clean = cleanFolder(folder);
	return clean === '' ? `${title.trim()}.md` : `${clean}/${title.trim()}.md`;
}

/**
 * What is wrong with a proposed title, or null when nothing is.
 *
 * Asked before the file is made rather than after, so the prompt can offer
 * nothing to create and say which of the three it is, instead of letting the
 * create fail and leaving the typed title to be retyped.
 */
export function titleProblem(title: string, folder: string, exists: (path: string) => boolean): TitleProblem | null {
	const name = title.trim();
	if (name === '') return 'empty';
	if (ILLEGAL.test(name)) return 'illegal';
	if (exists(notePath(folder, name))) return 'exists';
	return null;
}

/** What to say about each problem, in the prompt, where a result would be. */
export function titleMessage(problem: TitleProblem): string {
	if (problem === 'empty') return 'A note needs a name.';
	if (problem === 'illegal') return 'A name cannot contain \\ / : * ? " < > or |.';
	return 'A note by that name is already here.';
}
