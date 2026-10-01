# Settings

The settings shape, defaults and loading are in `src/core/settings.ts`.

## Shape

| Key | Default | |
| --- | --- | --- |
| `version` | `1` | `SETTINGS_VERSION`, stamped on every save. |
| `notesFolder` | `''` | Where notes are made, and the scope. Empty is the whole vault. |
| `templateFolder` | `'Templates'` | Where templates are read from. |
| `rememberTemplate` | `true` | Offer the last picked template first. |
| `axes` | `[]` | `{ namespace, values }` for each axis. |
| `unfiledTag` | `''` | The mirror tag. Empty writes none. |

## Loading

`loadSettings` builds a fresh object from the keys it knows, rather than editing
the saved one:

- A missing or wrongly typed key falls back to its default.
- A key nothing reads is dropped.
- Strings are trimmed, and a leading `#` is taken off the unfiled tag.

`readAxes` drops an axis without a namespace or without values, rather than
repairing it. An axis that can't be answered would make every note unfiled
forever, with no way out. Namespaces are normalised (`normaliseNamespace`: no
`#`, no trailing slash, spaces become `-`), values too (`normaliseValue`), and
duplicates are dropped.

`activeAxes` is the axes as a reload would keep them. The settings tab edits
`axes` in place, so an axis being added sits in the list with no namespace or
values until it's typed out. Everything that decides filing reads `activeAxes`,
never `settings.axes` directly, or pressing **Add axis** would unfile every note.

## Changing the shape

Settings written by a released version exist in other people's vaults.

- **Adding** a key with a default needs nothing: an absent key falls back to
  its default.
- **Removing** a key needs nothing: the loader drops keys it doesn't know.
- **Renaming** a key, or changing what it means, needs the old key read and
  carried over in `loadSettings`, and `SETTINGS_VERSION` bumped. Otherwise
  existing vaults lose the setting. Add a test in `tests/settings.test.ts` that
  loads the old shape.

## What may be a setting

Settings are addresses, not opinions: a folder, a tag, the values an axis takes.
A preference is allowed when it only changes how a picker offers things, never
what is written or when a note counts as filed, and its default is how the
plugin behaved without it. **Remember the last template** is the one example.
