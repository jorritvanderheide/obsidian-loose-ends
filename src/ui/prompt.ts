// Asking for a new note's name and its template, in one prompt.
//
// The field is the name and the list under it is the templates, so a note is
// one line of typing and Enter. The name is checked on every keystroke, and
// the line between the two says where the note will go or what is wrong with
// the name. A pick waits until the name can be used, rather than letting the
// create fail and handing back a prompt with the typed name gone.

import { SuggestModal, type App } from 'obsidian';
import { notePath, titleMessage, titleProblem } from '../core/note';
import type { Choice } from './choose';

export interface NewNote<T> {
	title: string;
	value: T;
}

class NotePrompt<T> extends SuggestModal<Choice<T>> {
	private readonly statusEl: HTMLElement;

	constructor(
		app: App,
		private readonly folder: string,
		private readonly exists: (path: string) => boolean,
		private readonly choices: Choice<T>[],
		private readonly done: (note: NewNote<T> | null) => void,
	) {
		super(app);
		this.setPlaceholder('Name the new note');
		this.setInstructions([
			{ command: '↑↓', purpose: 'to pick a template' },
			{ command: '↵', purpose: 'to create' },
			{ command: 'esc', purpose: 'to cancel' },
		]);
		this.statusEl = createDiv({ cls: 'loose-ends-status' });
		this.resultContainerEl.before(this.statusEl);
	}

	getSuggestions(query: string): Choice<T>[] {
		const found = titleProblem(query, this.folder, this.exists);
		// Nothing typed yet is not yet a mistake, so it prompts without scolding.
		if (found === 'empty') this.statusEl.setText('Type a name for the note.');
		else if (found === null) this.statusEl.setText(notePath(this.folder, query));
		else this.statusEl.setText(titleMessage(found));
		this.statusEl.toggleClass('mod-problem', found !== null && found !== 'empty');
		return this.choices;
	}

	renderSuggestion(choice: Choice<T>, el: HTMLElement): void {
		el.createDiv({ text: choice.label });
		if (choice.description !== undefined) {
			el.createDiv({ text: choice.description, cls: 'loose-ends-choice-description' });
		}
	}

	selectSuggestion(choice: Choice<T>, evt: MouseEvent | KeyboardEvent): void {
		if (titleProblem(this.inputEl.value, this.folder, this.exists) !== null) return;
		super.selectSuggestion(choice, evt);
	}

	onChooseSuggestion(choice: Choice<T>): void {
		this.done({ title: this.inputEl.value.trim(), value: choice.value });
	}

	onClose(): void {
		// Deferred, because Obsidian closes the modal before it reports the choice.
		window.setTimeout(() => this.done(null), 0);
	}
}

/** Ask for a usable note name and one of these, or null when dismissed. */
export function promptForNote<T>(
	app: App,
	folder: string,
	exists: (path: string) => boolean,
	choices: Choice<T>[],
): Promise<NewNote<T> | null> {
	return new Promise((resolve) => {
		let settled = false;
		const done = (note: NewNote<T> | null) => {
			if (settled) return;
			settled = true;
			resolve(note);
		};
		new NotePrompt(app, folder, exists, choices, done).open();
	});
}
