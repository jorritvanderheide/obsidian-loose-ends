// What a note's right-click menu offers, the same in the inbox block as in the
// file explorer, so the two cannot drift apart.

import type { Menu, TFile } from 'obsidian';
import { fileNote, setAxis } from '../commands/file-note';
import type { Context } from '../context';
import { isFiled } from '../core/filing';
import { activeAxes } from '../core/settings';
import { readTags } from '../core/tags';
import { cachedTags } from '../frontmatter';

/**
 * File note while the note still owes an answer, and Set for every axis
 * whether or not it does: an answer given in a hurry is the one most likely to
 * want changing.
 */
export function addFilingItems(menu: Menu, context: Context, file: TFile): void {
	const axes = activeAxes(context.settings);
	if (!isFiled(axes, readTags(cachedTags(context.app, file)))) {
		menu.addItem((item) =>
			item
				.setTitle('File note')
				.setIcon('tag')
				.onClick(() => void fileNote(context, file)),
		);
	}
	for (const axis of axes) {
		menu.addItem((item) =>
			item
				.setTitle(`Set ${axis.namespace}`)
				.setIcon('pencil')
				.onClick(() => void setAxis(context, axis, file)),
		);
	}
}
