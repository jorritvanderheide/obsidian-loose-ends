# Compatibility

Loose Ends writes tags into people's notes, reads the templates they wrote, and
keeps its settings in their vaults, and an update has to leave all of that
working. This page says what a release may and may not change. Changes are
listed in [CHANGELOG.md](../CHANGELOG.md).

Loose Ends' version is `MAJOR.MINOR.PATCH`. A minor or patch release breaks
nothing below. A major release may, and the changelog then says what changed
and what to do.

## Settings

`data.json`, written by `saveSettings` and read by `loadSettings` in
`src/core/settings.ts`. The keys and how they load are in
[Settings](settings.md).

- **Renaming a key, or changing what a value means**, such as a default, is
  breaking unless `loadSettings` reads the old value and carries it over. That
  bumps `SETTINGS_VERSION` and needs a fixture in `tests/settings.test.ts` with
  the shape the last release saved. `SETTINGS_VERSION` has been `1` since
  1.0.0, and nothing reads it back yet.
- **Changing how axes are cleaned up on load** (`readAxes`, `normaliseNamespace`,
  `normaliseValue`) changes which tags count as answers, so it counts as
  changing what a value means. 1.1.0 is the one release that did: it started
  trimming slashes off the ends of values already saved, so `vault/` loads as
  `vault`.
- **Adding** a key is not breaking, as long as its default is how the plugin
  behaved without it. An absent key loads as its default, the way
  `rememberTemplate` did in 1.2.0.
- **Removing** a key doesn't break loading: the loader drops keys it doesn't
  know. What the setting did going away is still a change for the changelog.
- **Going back** to an older release keeps working while the shape stays the
  same. The older release ignores a key it doesn't know, and drops it the next
  time it saves.

## What it writes in notes

Besides the notes **Add note** makes, Loose Ends only writes the `tags`
property of notes in the notes folder. Section 11.2 of the README promises
exactly this, so writing anything else in a note is breaking.

- **Answers** are written as `<namespace>/<value>`, replacing every other tag
  under that namespace and the bare namespace (`withValue`).
- **The unfiled tag** is written exactly as set, and only the one in the
  settings is ever taken off. A release that wrote it differently (another
  case, a prefix, a `#`) would leave the old one on every note.
- **An empty unfiled tag** means Loose Ends never edits a note on its own:
  only an answer you pick is written. A vault that never set one must stay
  that way.
- **The `tags` list** is written back as a list of tags without `#`, sorted
  ascending when a tag is added, because the Linter plugin sorts it on save.
- **What counts as filed** is read off the tags every time, and the sweep on
  startup rewrites the unfiled tag on every note in scope without a notice.
  So changing which tags answer an axis (exact comparison, see
  [Filing model](filing-model.md)), reading tags from anywhere but `tags`, or
  changing what the notes folder covers, rewrites people's notes on the first
  start after the update. That's breaking, and needs a test in
  `tests/filing.test.ts` or `tests/vocabulary.test.ts`.
- **The starter template** is only written on a fresh install, when there's no
  `data.json` yet. It has been `Default.md` since 1.2.0; installs from before
  keep their `Unfiled.md`.

## What it reads from templates and notes

People write templates and blocks for these, so changing them breaks what they
wrote. The details are in [Templates](templates.md).

- **Placeholders** `{{title}}`, `{{date}}`, `{{date:YYYY-MM}}`, `{{date:YYYY}}`
  and `{{cursor}}`, whatever their case and spacing. Paper Trail reads its own
  placeholders the same way, so a change here is a change to both. Adding a
  placeholder is not breaking; renaming or removing one is.
- **Prompts**: an HTML comment right under a template heading. A note is
  matched to its template by its headings, never by a stored marker, so a
  change to either rule changes which prompts existing notes show.
- **The inbox block** is a `loose-ends` code block (`INBOX_BLOCK`). Its name
  can't change. What's inside it is ignored today, so an option added later
  needs an empty block to keep meaning what it means now.

## Commands

The IDs are `add-note`, `file-note`, `refresh` and `set-<namespace>`, one for
each axis. People bind hotkeys to them and run them from other plugins, so
renaming one is breaking. Their names can change. Commands ship without
hotkeys, and a release doesn't add one.

Loose Ends registers no views and no URI handler.

## Other plugins

- **Tag Along** shows the unfiled tag as a folder, because it's an ordinary tag
  in `tags`. Both READMEs tell people to make it an exclusive folder there.
- **Paper Trail** shares the placeholder rules above. Its literature folder is
  kept free of the unfiled tag by the notes folder, which is why the scope
  can't widen.

## Obsidian versions and platforms

- **`minAppVersion`** is `1.13.0`, and has been for every release. Raising it is
  allowed in a minor release: Obsidian keeps an older app on the last release
  `versions.json` says it can run. Change it in `manifest.json` before
  `npm version`, which copies it into `versions.json` for the new version.
  Never edit an entry that's already in `versions.json`.
- **Desktop and mobile**: `isDesktopOnly` is `false`, and stays that way. Code
  that needs Node or Electron, or a regex older iOS can't parse (see
  [Templates](templates.md#dates-in-names)), stops the plugin loading on a
  phone.

## Not covered

These can change in any release:

- How the inbox block, the prompts and the pickers look, their CSS classes,
  and the wording of command names, notices and questions.
- Local storage: the recent picks and the filing log. Anything unreadable there
  reads as empty, which costs an order or the Recently filed section, never an
  answer.
- The code under `src/`.
