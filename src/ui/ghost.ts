// What a template asks, drawn on the line you would answer it on.
//
// Wiring only. Which template a note came from, which lines, and whether at
// all, is `ghostsFor` in core. The widget is Paper Trail's question, which
// replaced the same HTML comments for the same reasons.

import { editorInfoField } from 'obsidian';
import { RangeSetBuilder, StateEffect } from '@codemirror/state';
import { Decoration, ViewPlugin, WidgetType, type DecorationSet, type EditorView, type ViewUpdate } from '@codemirror/view';
import { ghostsFor, type TemplatePrompts } from '../core/prompts';

/** What drawing needs from the plugin, and nothing else. */
export interface GhostSource {
	/** Whether a note is one the plugin looks after. */
	inScope(path: string): boolean;
	/** What the templates ask, as last read. */
	prompts(): readonly TemplatePrompts[];
}

/** Draw again without the text having changed, because a template did. */
const redraw = StateEffect.define<null>();

/** Every editor the extension is in, so a template edit reaches them all. */
const views = new Set<EditorView>();

/** Draw every open note again, after the templates were read again. */
export function redrawGhosts(): void {
	for (const view of views) view.dispatch({ effects: redraw.of(null) });
}

class Prompt extends WidgetType {
	constructor(private readonly text: string) {
		super();
	}

	eq(other: Prompt): boolean {
		return other.text === this.text;
	}

	// The global helper rather than the document the editor is in: a node made
	// in the main window is adopted by a popout one when the editor inserts it.
	toDOM(): HTMLElement {
		return createSpan({
			cls: 'loose-ends-prompt',
			text: this.text,
			// Decoration, not content: a screen reader reading the note should read
			// the note.
			attr: { 'aria-hidden': 'true' },
		});
	}

	// Clicks go to the editor, so clicking the prompt puts the cursor on its
	// line rather than landing on a widget that does nothing.
	ignoreEvent(): boolean {
		return false;
	}
}

/** The editor extension, registered once for every markdown editor. */
export function ghosts(source: GhostSource) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(private readonly view: EditorView) {
				views.add(view);
				this.decorations = draw(view, source);
			}

			update(update: ViewUpdate): void {
				const asked = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(redraw)));
				if (update.docChanged || update.viewportChanged || asked) this.decorations = draw(update.view, source);
			}

			destroy(): void {
				views.delete(this.view);
			}
		},
		{ decorations: (plugin) => plugin.decorations },
	);
}

function draw(view: EditorView, source: GhostSource): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	const file = view.state.field(editorInfoField, false)?.file;
	if (!file || !source.inScope(file.path)) return builder.finish();

	for (const { line, text } of ghostsFor(view.state.doc.toString(), source.prompts())) {
		const at = view.state.doc.line(line + 1).from;
		builder.add(at, at, Decoration.widget({ widget: new Prompt(text), side: 1 }));
	}
	return builder.finish();
}
