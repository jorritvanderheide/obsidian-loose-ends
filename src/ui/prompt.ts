// Asking for a new note's name and its template, in one prompt.
//
// The field is the name and the list under it is the templates, so a note is
// one line of typing and Enter. The name is checked on every keystroke, and
// the line between the two says where the note will go or what is wrong with
// the name. A pick waits until the name can be used, rather than letting the
// create fail and handing back a prompt with the typed name gone.

import { SuggestModal, type App } from 'obsidian';
import { notePath, titleMessage, titleProblem, type TitleProblem } from '../core/note';
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
		private readonly nameFor: (typed: string, value: T) => string,
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
		this.showStatus(query);
		return this.choices;
	}

	/**
	 * Typing the name checks it and leaves the list alone.
	 *
	 * Obsidian's own handler lists the suggestions again on every keystroke,
	 * which moves the selection back to the first one, so a template picked
	 * before the name was typed was quietly dropped. The list does not depend
	 * on the name, so there is nothing to list again. `onInput` is not in the
	 * typings; if it goes away, the prompt still works and only the reset is back.
	 */
	onInput(): void {
		this.showStatus(this.inputEl.value);
	}

	private showStatus(query: string): void {
		const found = titleProblem(query, this.folder, this.exists);
		// Nothing typed yet is not yet a mistake, so it prompts without scolding.
		if (found === 'empty') this.statusEl.setText('Type a name for the note.');
		else if (found === null) this.statusEl.setText(notePath(this.folder, query));
		else this.statusEl.setText(titleMessage(found));
		this.statusEl.toggleClass('mod-problem', found !== null && found !== 'empty');
	}

	renderSuggestion(choice: Choice<T>, el: HTMLElement): void {
		el.createDiv({ text: choice.label });
		if (choice.description !== undefined) {
			el.createDiv({ text: choice.description, cls: 'loose-ends-choice-description' });
		}
	}

	/**
	 * A pick is checked against the name the note will really get, which a
	 * template that dates the name makes longer than what was typed. An empty
	 * field is still refused as empty, or a dated template would make a note
	 * named only after the day.
	 */
	selectSuggestion(choice: Choice<T>, evt: MouseEvent | KeyboardEvent): void {
		const typed = this.inputEl.value;
		const found =
			titleProblem(typed, this.folder, this.exists) === 'empty'
				? 'empty'
				: titleProblem(this.nameFor(typed, choice.value), this.folder, this.exists);
		if (found !== null) {
			if (found !== 'empty') this.showProblem(found);
			return;
		}
		super.selectSuggestion(choice, evt);
	}

	private showProblem(problem: TitleProblem): void {
		this.statusEl.setText(titleMessage(problem));
		this.statusEl.toggleClass('mod-problem', true);
	}

	onChooseSuggestion(choice: Choice<T>): void {
		this.done({ title: this.inputEl.value.trim(), value: choice.value });
	}

	onClose(): void {
		// Deferred, because Obsidian closes the modal before it reports the choice.
		window.setTimeout(() => this.done(null), 0);
	}
}

/**
 * Ask for a usable note name and one of these, or null when dismissed.
 * `nameFor` is the name a note gets from what was typed and what was picked.
 */
export function promptForNote<T>(
	app: App,
	folder: string,
	exists: (path: string) => boolean,
	choices: Choice<T>[],
	nameFor: (typed: string, value: T) => string,
): Promise<NewNote<T> | null> {
	return new Promise((resolve) => {
		let settled = false;
		const done = (note: NewNote<T> | null) => {
			if (settled) return;
			settled = true;
			resolve(note);
		};
		new NotePrompt(app, folder, exists, choices, nameFor, done).open();
	});
}
