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

A template can also ask something under each heading. Put an HTML comment right
under a heading and it becomes that heading's prompt: **Add note** leaves it out
of the note, and the editor draws it faintly on the empty line under the heading
until you write there. It lives only in the template, so rewording it rewords
every note, and nothing stays behind under what you wrote. A note gets the
prompts of the template whose headings it has; a template with no heading
besides its title cannot be recognised, so its prompts are never drawn.

**File note** asks only what the open note is still missing, one axis at a time,
in the order you configured them, offering the values you picked most recently
first. Dismiss a question and what you already answered is kept: half an answer
is progress, and making you redo it would be the annoying half.

**Set `<axis>`** changes one answer afterwards, whether or not it was already
given. One command per axis, named after it.

Both are on the right-click menu of a note in the notes folder, in the file
explorer and anywhere else Obsidian offers a note's menu: **File note** while
the note is still missing an answer, and **Set `<axis>`** always.

**Refresh tags** checks every note in your notes folder against the axes. It
runs by itself when you remove an axis, and when you close settings after
changing them. An axis still missing its namespace or values does not count yet.

A block shows the inbox on any note of your own:

````
```loose-ends
```
````

The first group lists every note in the notes folder still missing an answer,
newest first, with what it is missing in the tooltip. It is named after the
unfiled tag: **Inbox** when the tag is `inbox`, **Unfiled** when there is none.
Click a row to open the note in a new tab, press the tag at its end to file it
where it is, or right-click it to file it or set one axis. **Recently filed**,
under it and shut until you open it, lists in grey the notes filed in the last
seven days.
When a note was filed is the one thing no tag says, so it is kept on this
device only, and a note filed by changing the axes rather than its tags does
not count.

None of the commands has a hotkey. Which keys you want is yours to decide, you
already have bindings this plugin knows nothing about, and a default that
collides is worse than no default.

## Values are compared exactly

`domain/phd/wp1` does not answer the `domain` axis, and neither does a bare
`domain`. Only `domain/phd` does. When **File note** or **Set `<axis>`** asks
about an axis, the question names any tag under it that is not one of its
values, and picking a value replaces it. Nothing else touches it.

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
| **Template folder** | Markdown files here are offered when a note is made. `{{title}}` becomes the name of the note, `{{date}}` the date as `YYYY-MM-DD`, and the cursor starts at `{{cursor}}`. A title heading with `{{date}}` in it, such as `# {{title}} {{date}}`, puts the date in the note's name too: `Hanna` becomes `Hanna 2026-09-30`. A date typed in the name is used instead of today's. An HTML comment right under a heading is that heading's prompt, drawn in the note instead of copied into it. |
| **Remember the last template** | On, the template you picked last is offered first. Off, `Default` is offered first and the rest by name, for a vault where one template is the usual answer. |
| **Unfiled tag** | The tag written on a note that has not answered everything, and the name of the inbox block's first group (its last segment, capitalised). Empty writes none, for a vault that would rather query than browse. |
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
`Default.md`, in the template folder, unless a file by that name is already
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
