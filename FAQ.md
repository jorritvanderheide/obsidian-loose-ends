# Frequently asked questions

Can't find your answer here? Please
[open an issue](https://github.com/jorritvanderheide/obsidian-loose-ends/issues/new/choose).

- [Filing](#filing)
- [The inbox](#the-inbox)
- [Templates](#templates)
- [Other](#other)

## Filing

### Do I have to make my notes with Add note?

No. Any note in your notes folder counts, however you made it: with Obsidian's
new note button, as a daily note, or with Templater or QuickAdd. It gets the
unfiled tag as soon as Obsidian has read it, and **File note** works on it like
on any other. **Add note** is just the quickest way to a note with a name and a
template.

### The unfiled tag keeps coming back

That's on purpose. Loose Ends checks the note's tags every time the note
changes, and puts the unfiled tag back for as long as an answer is missing.
Answer the last question with **File note**, and it goes away by itself.

### I tagged a note, but it still counts as unfiled

Check these:

- **Is the tag in the `tags` property?** Only tags there count as answers. A
  `#domain/work` written in the text of the note doesn't.
- **Is it exactly one of the values?** `domain/work/project-x` doesn't answer
  `domain` unless `work/project-x` is in that axis's list, and neither does a
  bare `domain`. **File note** names tags like these when it asks, and picking
  a value replaces them.
- **Is the spelling the same?** Only exact matches count, so `Work` and `work`
  are different answers.

### Why not just accept anything that starts with `domain/`?

Because then a typo or a forgotten old tag would quietly count as filed. The
README tells [the story behind it](README.md#63-only-the-exact-values-count).
If you want nested answers, list them as values. A value can have a slash in
it, like `work/project-x`.

### Every note in my literature folder is unfiled

Set **Notes folder** to the folder for your own notes. Loose Ends only tags
notes inside it, and leaves the rest alone. Notes that belong to another
plugin, like literature notes from Paper Trail or Zotero, will never answer
your axes. Inside the notes folder, they'd stay unfiled forever.

### "This note is outside your notes folder, and Loose Ends only files notes inside it."

**File note** and the **Set** commands only work on notes in your **Notes
folder**, and the note you have open is somewhere else. Move it into that
folder, or change Settings → Loose Ends → **Notes folder** so it includes the
note.

### "There's no note open to file."

**File note** and the **Set** commands work on the note you have open, and
there wasn't one. Open a note in your notes folder and run the command again.
To file a note without opening it, right-click it in the file explorer, or use
the tag button on its row in the inbox block.

### "Loose Ends didn't change this note's tags, because its tags property holds something that isn't a tag, like a nested list. …"

Every entry in a note's `tags` property should be a plain tag, and one of them
isn't. It might be a link, like `[[Project]]`, which Obsidian reads as a list
inside the list, or a property typed into the list, like `- status: done`.
Writing the tags back would lose that entry, so Loose Ends leaves them alone.
Change it into a plain tag, or move it to a property of its own, and run the
command again. Until then, the note doesn't get the unfiled tag either.

### "Loose Ends has no axes yet."

You haven't told it what a note needs yet. Add an axis in Settings → Loose Ends
→ **Axes**, with a top-level tag like `domain` and the values it accepts.

### I closed the question halfway. Is the note half-filed?

Yes. The answers you already gave are kept, because half an answer is still
progress. Run **File note** again, and it only asks what's still missing.

### Nothing happened when I changed the axes

Notes are checked again when you close the settings, not while you're typing.
You can also run **Refresh tags** to check every note right away.

## The inbox

### How do I show the inbox?

Put this block on any note, like a dashboard:

````
```loose-ends
```
````

It lists every note in your notes folder that's still missing an answer,
newest first. Hover over a row to see what it's missing.

### Recently filed is empty on my other device

That's expected. No tag says when a note was filed, so Loose Ends keeps that
date on the device where you filed it. It doesn't sync, and neither does the
order of your recent picks. Your answers are tags, though, so those sync like
everything else.

### A note counts as filed after I changed the axes, but it isn't under Recently filed

Recently filed only lists the notes you filed yourself. When a note counts as
filed only because the axes changed, nobody filed it. That's why it doesn't
show up there.

## Templates

### My prompts don't show up

Loose Ends tells which template a note came from by its headings. Check these:

- **Does the template have a heading besides the title?** If a template only
  has a title heading, there's nothing to tell it by, and its prompts won't
  show.
- **Is the comment right under the heading, on its own lines?** A comment with
  text after it on the same line isn't a prompt.
- **Is something already written under the heading?** The prompt disappears as
  soon as you write there.
- **Is the note in your notes folder?** Prompts are only shown there.

### How do dates in names work?

Put a date in the template's title heading, like `# {{title}} {{date}}`. Typing
`Hanna` then makes `Hanna 2026-09-30`. Type a date yourself, like
`Hanna 2026-10-07`, and that date is used instead. Use `{{date:YYYY-MM}}` or
`{{date:YYYY}}` for a note about a month or a year.

### My template has the unfiled tag

Loose Ends 1.6.0 and earlier added the unfiled tag to templates when the notes
folder was left empty. Newer versions leave your template folder alone. Take
the tag off the template once, and it won't come back. A note you already made
from it loses the tag when you file it, like any other note.

### I deleted the Default template, and it didn't come back

Loose Ends only writes it once, on a fresh install. If you delete it, it takes
that as your answer and leaves it deleted.

## Other

### Does it work on mobile?

Yes. Everything works on a phone or tablet.

### Why don't the commands have hotkeys?

You already have hotkeys Loose Ends knows nothing about, and a default that
collides with one of yours is worse than no default. Pick your own in Settings
→ Hotkeys.
