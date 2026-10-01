# Filing model

What "filed" means, which is the whole product. The code is
`src/core/filing.ts` and `src/core/vocabulary.ts`.

## Axes and values

An axis is a top-level tag (the code calls it the namespace, `axis.namespace`)
and the values it accepts (`axis.values`). The tag `domain/phd` is the axis
`domain` answered with `phd`.

A value may contain slashes: `phd/wp1` is one value like any other, and
`domain/phd/wp1` answers `domain` only when `phd/wp1` is in the list.

## Filed is read, never stored

A note is **filed** when every configured axis has a value on it
(`isFiled`, `missingAxes`). This is read off the note's tags every time it is
asked. Nothing records it.

No axes configured means every note is filed: nothing has been asked for, so
nothing is owed. It also means the plugin writes no unfiled tag at all until
somebody says what they want filed by.

## The unfiled tag is a mirror

The unfiled tag is the one thing written that isn't an answer. It exists only so
a tag tree can show a folder of unfiled notes.

- It is **derived, never authoritative**. If it and the note disagree, the note
  wins and the tag is rewritten (`withMirror`).
- An empty **Unfiled tag** writes none and takes none off. A vault that never
  turned it on is left exactly as it was, including having no `tags` key.
- Every write is guarded by `mirrorIsCurrent`. See
  [Architecture](architecture.md#the-write-loop).

## Only the `tags` property counts

Tags are read from the `tags` frontmatter property (`readTags` in
`core/tags.ts`), which accepts a list, a single string, or a comma or space
separated string, with or without a leading `#`. Tags in the body of a note
don't answer an axis.

When an answer is written, the list is kept sorted ascending, because the
Linter plugin sorts it on save anyway, and any other order would show up as a
change nobody made.

## Exact comparison

`valueOf` is the one place a value is read off a note's tags, and it compares
exactly: a tag answers an axis when it is the namespace, a slash, and one of the
listed values, with nothing after it. Never `startsWith`.

This is the bug the plugin was written after. Its predecessor compared with
`startsWith`, so `domain/phd/wp1` passed while the vocabulary only knew flat
values and no picker would offer a nested one.

## Stray tags are reported, never repaired

A tag under an axis that isn't one of its values is a **stray** (`strayTags`).
Loose Ends never corrects it: a tag somebody typed is a tag somebody meant, and
guessing which known value they meant loses data quietly. Instead,
`questionFor` names the strays when it asks about that axis, and says that
picking a value replaces them. Answering an axis removes every tag under it,
and the bare namespace, before adding the new one (`withValue`).

## Dismissing keeps what was answered

**File note** asks for the missing axes one at a time, in the configured order.
Closing a question stops there and keeps the answers already given. Half an
answer is progress, and rolling it back would make the user redo it.

## Scope

The notes folder is the only place the unfiled tag is ever written. A folder
owned by another plugin, such as literature notes, answers no axis and never
will, so without the scope every note in it would read as unfiled forever.

## What isn't configurable

The loop itself: capture without classifying, then classify, with a tag that
won't go away until you have. A setting is allowed when it is an address (a
folder, a tag, the values an axis takes), or a preference that only changes how
a picker offers things, never what is written or when a note counts as filed.
