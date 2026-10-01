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

That's on purpose. The unfiled tag is worked out from the note's own tags every
time the note changes, so deleting it by hand doesn't work: it comes back as
long as the note is missing an answer. Answer the last question with **File
note**, and it goes away by itself.

### I tagged a note, but it still counts as unfiled

Check these:

- **Is the tag in the `tags` property?** Only tags there count as answers. A
  `#domain/work` written in the text of the note doesn't.
- **Is it exactly one of the values?** `domain/work/project-x` doesn't answer
  `domain` unless `work/project-x` is in that axis's list, and neither does a
  bare `domain`. **File note** names tags like these when it asks, and picking
  a value replaces them.
- **Is the spelling the same?** Values are compared exactly, so `Work` and
  `work` are different answers.

### Why not just accept anything that starts with `domain/`?

Because then a typo or a forgotten old tag would quietly count as filed. The
README tells [the story behind it](README.md#63-values-are-compared-exactly).
If you want nested answers, list them as values: a value can have a slash in
it.

### Every note in my literature folder is unfiled

Set **Notes folder** to the folder for your own notes. Loose Ends only tags
notes inside it, so notes that belong to another plugin, like literature notes
from Paper Trail or Zotero, are left alone. Those will never answer your axes,
so without a notes folder they'd stay unfiled forever.

### "Loose Ends only files notes in its notes folder."

The note you tried to file is outside your **Notes folder**. Move it in, or
change the setting.

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

That's expected. When a note was filed is the one thing no tag says, so it's
kept on the device where you filed it, and doesn't sync. The same goes for the
order of your most recent picks. Your answers themselves are tags, so those
sync like everything else.

### A note I filed by changing the axes isn't under Recently filed

Recently filed only lists notes that you filed. A note that counts as filed
because the axes changed hasn't been filed by anyone, so it isn't listed.

## Templates

### My prompts don't show up

A note is matched to its template by its headings, so check these:

- **Does the template have a heading besides the title?** A template with only
  a title heading can't be recognised, so its prompts are never shown.
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
