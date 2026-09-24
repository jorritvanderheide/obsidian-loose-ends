# Loose Ends

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

**Capture a note without classifying it, then classify it later, and let nothing quietly stay unclassified.**

Deciding where a note belongs is the most expensive thing about writing one, and
it is due at the worst possible moment: while you still have the thought. So
either you stop to classify and lose the thread, or you do not and the note joins
the pile nobody will ever sort.

Loose Ends splits the two. A new note arrives answering nothing. Whatever it has
not answered, it carries one tag saying so, and that tag is what puts it in
front of you until you deal with it.

## How it works

You say what a note has to answer. An **axis** is a tag namespace and the values
it accepts:

```
domain   phd, vault, personal
source   ai, article, book, meeting, own, prototype, talk
```

A note that has answered every axis is **filed**. One that has not is
**unfiled**, and gets the tag you named for it, such as `status/unfiled`.

That tag is the only thing stored, and it is derived: read off the note's own
tags every time, never trusted over them. Delete it by hand and it comes back.
Answer the last axis and it goes. Nothing caches, and nothing has to be kept in
step, because there is only ever one copy of the fact.

Which matters because the tag is not the record. **The answers are the record.**
The tag exists so a tag tree can show you a folder of what is still owed, and
that is its whole job.

## Working the loop

**Add note** asks for a name and a template in one prompt: you type the name,
and the templates in your template folder are listed under it, the ones you
picked most recently first. It asks nothing else. A template may carry the tags
it is certain of, and the rest is left for later.

**File note** asks only what the open note is still missing, one axis at a time,
in the order you configured them, offering the values you picked most recently
first. Dismiss a question and what you already answered is kept: half an answer
is progress, and making you redo it would be the annoying half.

**Set `<axis>`** changes one answer afterwards, whether or not it was already
given. One command per axis, named after it.

**Refresh tags** checks every note in your notes folder against the axes. Run it
after changing the vocabulary, when notes that used to be filed may no longer be.

None of them has a hotkey. Which keys you want is yours to decide, you already
have bindings this plugin knows nothing about, and a default that collides is
worse than no default.

## Values are compared exactly

`domain/phd/wp1` does not answer the `domain` axis, and neither does a bare
`domain`. Only `domain/phd` does.

This is deliberate and it is the bug this plugin was written after. Its
predecessor compared with `startsWith`, so a nested tag passed validation while
the vocabulary only ever knew flat values and no suggester would ever offer one.
The only way in was typing frontmatter by hand, which made the first typo a
matter of time, and one that would not surface until the tag tree came apart.

If you want sub-categories, a link does it better than a tag. A tag forces one
answer per note, and material gets used more than once.

## Settings

| Setting | |
| --- | --- |
| **Notes folder** | Where a new note is made, and the only folder that ever gets the unfiled tag. Empty means the whole vault. Keeping it narrow is what stops the tag landing on notes another plugin owns, such as a literature folder, where every note would read as unfiled for ever. |
| **Template folder** | Markdown files here are offered when a note is made. `{{title}}` becomes the name of the note, and the cursor starts at `{{cursor}}`. |
| **Unfiled tag** | The tag written on a note that has not answered everything. Empty writes none, for a vault that would rather query than browse. |
| **Axes** | What a note has to answer. A namespace and its values. The picker offers the values you picked most recently first, then the rest in the order given here. |

The loop is not a setting. Capture without classifying, then classify, with
something visible that will not let you forget: that is the product. Making it
configurable would turn it into a rules engine that asks you to invent a filing
system before you can use one, which is what Dataview already is.

## Safety

Loose Ends writes two things and no others: the value you pick on the axis you
picked it for, and the unfiled tag. Every other frontmatter key, every other
tag, and every word you wrote are yours and are passed through untouched.

It never writes outside the notes folder, runs no commands, and talks to
nothing. The one exception is on a fresh install: it puts a starter template,
`Unfiled.md`, in the template folder, unless a file by that name is already
there. Edit it or delete it; it is not written again.

## Requirements

Obsidian 1.13 or later.

## Installation

Download `main.js`, `manifest.json` and `styles.css` from the latest release
into `.obsidian/plugins/loose-ends/` in your vault, then enable **Loose Ends**
under Settings → Community plugins.

## Development

```sh
nix develop     # or any Node.js 20+
npm install
npm run dev
npm test
npm run lint
```

`src/core/` is pure and holds every decision, with a test named after each file.
`src/commands/` and `src/ui/` wire that to Obsidian.

## License

[EUPL-1.2](LICENSE)
