// One picker, used for every axis value.
//
// A suggester rather than a dropdown because the list is the vocabulary and the
// vocabulary grows: at four values a dropdown is fine and at twenty it is a
// scroll, while typing two letters is the same gesture either way.

import { FuzzySuggestModal, type App, type FuzzyMatch } from 'obsidian';

export interface Choice<T> {
	value: T;
	label: string;
	description?: string;
}

class Chooser<T> extends FuzzySuggestModal<Choice<T>> {
	constructor(
		app: App,
		private readonly choices: Choice<T>[],
		placeholder: string,
		private readonly done: (value: T | null) => void,
	) {
		super(app);
		this.setPlaceholder(placeholder);
	}

	getItems(): Choice<T>[] {
		return this.choices;
	}

	getItemText(item: Choice<T>): string {
		return item.description === undefined ? item.label : `${item.label} ${item.description}`;
	}

	renderSuggestion(match: FuzzyMatch<Choice<T>>, el: HTMLElement): void {
		el.createDiv({ text: match.item.label });
		if (match.item.description !== undefined) {
			el.createDiv({ text: match.item.description, cls: 'loose-ends-choice-description' });
		}
	}

	onChooseItem(item: Choice<T>): void {
		this.done(item.value);
	}

	onClose(): void {
		// Escape has to answer too, or the command that awaited this never returns.
		// Deferred, because Obsidian closes the modal before it reports the pick:
		// answering null here would settle the promise and throw the pick away.
		window.setTimeout(() => this.done(null), 0);
	}
}

/** Ask for one of these, or null when the picker is dismissed. */
export function choose<T>(app: App, choices: Choice<T>[], placeholder: string): Promise<T | null> {
	return new Promise((resolve) => {
		let settled = false;
		const done = (value: T | null) => {
			if (settled) return;
			settled = true;
			resolve(value);
		};
		new Chooser(app, choices, placeholder, done).open();
	});
}
