# Templates

How **Add note** turns a template into a note, and how prompts work. The code
is `src/core/template.ts` and `src/core/prompts.ts`.

## Which files are templates

Every Markdown file directly in the template folder (`isTemplate`,
`templateFiles`), sorted by name. Files in subfolders aren't offered.

On a fresh install (no `data.json` yet), `writeStarterTemplate` writes
`Default.md`:

```markdown

# {{title}}

{{cursor}}
```

The empty first line keeps the heading clear of the frontmatter the unfiled tag
is written into. The starter is never written over an existing file, and never
again after the first run.

## Placeholders

There are three, and deliberately no more, because a template language is a
second thing to learn. They are matched whatever their case and spacing.

| Placeholder | Becomes |
| --- | --- |
| `{{title}}` | The name as typed, minus a typed date (see below) |
| `{{date}}` | The date as `YYYY-MM-DD` |
| `{{date:YYYY-MM}}`, `{{date:YYYY}}` | The same date, cut short |
| `{{cursor}}` | Removed; the cursor is placed there |

The date takes a precision, not a format, so it always sorts. Anything else
after the colon isn't a placeholder and is left as written.

Replacements are functions, not strings, so a `$&` in a typed name is written
as typed rather than read as a pattern.

## Dates in names

`makeNote` decides the name and text of a new note:

- A template whose **title heading** (the first heading with `{{title}}`)
  contains a date placeholder puts the date in the note's name: the name is
  that heading, filled in. `# {{title}} {{date}}` and `Hanna` make
  `Hanna 2026-09-30`.
- A date typed in the name is used instead of today's, and taken out of the
  title so it isn't written twice. `Hanna 2026-10-07` stays that.
- A typed date is only read at the precision the heading asks for or finer: a
  heading dated to the month also takes a typed `YYYY-MM`, but a full-date
  heading doesn't read `Budget 2026-10` as a date.
- A four-digit number only counts as a year between 1900 and 2099, so
  `Top 1000 papers` keeps its thousand. A month or day that doesn't exist, like
  `2026-13`, isn't a date.

The date patterns use a capture group rather than a lookbehind, because older
iOS can't parse lookbehinds, and one regex it can't parse stops the whole plugin
loading there.

## The cursor

`placeCursor` removes every `{{cursor}}` and remembers where the first one was,
counted from the **end** of the text. The unfiled tag is written into the
frontmatter after the note is made, which moves everything below it except its
distance from the end.

## Prompts

A prompt is an HTML comment that is the first thing under a heading in a
template, on lines of its own (`promptUnder`). A comment with text after it on
the same line, or an empty comment, isn't a prompt.

- **Add note** takes prompts out of the note it makes (`withoutPrompts`). A
  prompt that was all its section held leaves one empty line, for the prompt to
  be drawn on. Other comments are kept.
- The editor extension in `ui/ghost.ts` draws each prompt on the empty line
  under its heading, as long as nothing is written under that heading yet
  (`emptyLineUnder`).
- Headings inside frontmatter or fenced code aren't headings (`headingsIn`).

Prompts were once copied into notes. They went stale when a template was
reworded, and stayed under the answer once it was written. Drawn, they are in
no file.

## Matching a note to its template

A note keeps no record of which template it came from, because that would be a
second copy of something the note already shows. Instead, a note belongs to the
template whose every heading it has, and to the one with the most headings when
several fit. A template with no heading besides the title is recognised by
nothing, so its prompts are never drawn.
