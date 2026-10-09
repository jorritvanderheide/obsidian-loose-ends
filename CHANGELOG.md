# Changelog

What changed in each release of Loose Ends, newest first. What counts as
breaking is in [Compatibility](docs/compatibility.md).

## 1.5.1

- Recently filed says when a note was filed without Obsidian's bundled moment library, and always in English, like the rest of the inbox block.
- The README and FAQ now say that a note made any other way, such as with Obsidian's new note button, as a daily note, or with Templater or QuickAdd, gets the unfiled tag too, as long as it's in your notes folder.
- How releases are built, and how to check the file you installed, is now under "Network and file disclosure" in the README.
- The install step and the development docs are worded the same way as the other plugins.

## 1.5.0

- Friendlier wording in the commands, notices and the settings tab.
- A clearer plugin description: "Write notes now and tag them later, with an inbox of the notes still waiting for tags."
- Removed the funding link from the manifest.
- The README has been restructured and now has screenshots, and there's a new FAQ.
- Added issue forms and a security policy.

## 1.4.0

### Added

- {{date}} can be shortened. {{date:YYYY-MM}} writes 2026-09 and {{date:YYYY}} writes 2026. It’s the same date cut short, so it still sorts. {{date:YYYY-MM-DD}} is the same as {{date}}. Case and spacing don’t matter, so {{ date : yyyy }} works.
- Month and year dates in note names. A title heading like # {{title}} {{date:YYYY-MM}} names the note after the month, so Month becomes Month 2026-09.
- Typed months and years replace today’s date. With a month heading, typing Month 2026-10 keeps that name, which helps when a month is written up after it ended. A full typed day is cut to its month, so Month 2026-10-31 becomes Month 2026-10. A year heading takes a typed year the same way.

### Fixed

- Only real dates are read from a typed name. A month has to exist, and a day has to exist in that month, so 2026-13 and 2026-02-30 are no longer taken as dates. With a year heading, a bare number only counts as a year between 1900 and 2099, so Top 1000 papers stays Top 1000 papers 2026 instead of becoming Top papers 1000. If something only looks like a date, the rest of the name is still checked, so Top 1000 papers 2027 is dated 2027.

## 1.3.0

- {{date}} in templates. In a title heading it also dates the note’s name, and a date you type takes priority.
- An empty template section gets its prompt on a line of its own, between blank lines.
- The inbox block is named after your unfiled tag, so it reads “Inbox”.
- Fixes: a $ in names, a date pattern that would break loading on older iOS, and silent errors when a template can’t be read.

## 1.2.0

### New

- Inbox block. Put a loose-ends code block in any note of your own and it lists every unfiled note in the notes folder, newest first. The tooltip on each row shows what that note is still missing. Click a row to open the note in a new tab, press its tag to file it where it is, or right-click it to file it or set one axis. The block uses the same nav markup as Paper Trail’s reading list, so the two look alike.
- Recently filed. Under the inbox, a collapsed section lists in grey the notes filed in the last seven days. When a note was filed is kept in local storage on that device only, because no tag records it. A note that became filed because the axes changed, rather than its tags, is not logged.
- Context menu filing. Right-clicking a note in the notes folder offers File note while it is still missing an answer, and Set <axis> for every axis always. This works in the file explorer and anywhere else Obsidian shows a note’s menu. File note and Set <axis> now accept any note, not just the open one, and name the note in the question when it isn’t the one open.
- Remember the last template setting. It is on by default, which keeps the old picker behaviour. When it is off, Add note offers Default first and the other templates by name.

### Changed

- On a fresh install the starter template is now Default.md instead of Unfiled.md. Existing installs keep their Unfiled.md.
- Add note no longer offers an empty note next to the templates. It only offers one when the template folder has no templates.

### Fixed

- A template picked before the note’s name was typed is no longer lost. Obsidian re-lists the suggestions on every keystroke, which moved the selection back to the first template. Typing now only checks the name.
- The inbox block’s filing log and redraws now stay in step:
- Notes the metadata cache hasn’t read yet are no longer counted as unfiled, so a new device or a rebuilt cache doesn’t log every filed note as just filed.
- The watch takes stock again on every settings save.
- A deleted note’s filing record is forgotten.
- The block only redraws for notes it could list, and also when a note is created.
- It cancels a pending redraw when it closes and no longer draws twice when opened.

## 1.1.1

### Fixed

- Removing an axis now refreshes the unfiled tag straight away. You no longer have to run **Refresh tags** yourself.
- Adding an axis, or editing its namespace or values, refreshes the tag once when you close settings, if the axes changed.
- An axis that is still missing its namespace or values no longer counts. Before, pressing **Add axis** meant any note edited before you finished typing it was tagged unfiled.
- **Set `<axis>`** commands now follow the axes as you change them. A removed axis no longer keeps its command until Obsidian restarts, and a new or renamed one shows up without a restart.

## 1.1.0

- Template prompts. An HTML comment right under a heading in a template is now that heading’s prompt. Add note leaves it out of the new note, and the editor draws it faintly on the empty line under the heading until you write something there.
- Stray tags are reported. When File note or Set asks about an axis, the question names any tag under that axis that isn’t one of its values, for example “Which domain? domain/work/job isn’t one of them, and picking one replaces it.”
- Nested values are cleaned up. Axis values like work/job work as before. Slashes at either end are now removed and doubled slashes collapsed, both when you type values and for values already saved.
- Clearer settings text. The Axes description now says a tag not in the list, nested or not, never counts as an answer. The Template folder description explains prompts.

## 1.0.0

### Loose Ends 1.0.0

The first release. Loose Ends lets you make a note without classifying it, and makes sure you classify it later. Until you do, the note carries one tag, such as `status/unfiled`, so a tag tree shows a folder of what is still owed.

### What it does

- **Axes.** You say what a note has to answer: a tag namespace and the values it accepts, such as `domain` with `phd, vault, personal`. A note that answers every axis is filed.
- **Add note** asks for a name and a template in one prompt, and nothing else. Templates take `{{title}}` and `{{cursor}}`.
- **File note** asks only what the open note is still missing, one axis at a time. Dismiss a question and what you already answered is kept.
- **Set `<axis>`** gives or changes one answer directly. One command per axis.
- **Refresh tags** checks every note in the notes folder, for after you change the axes.
- **The unfiled tag is derived.** It is read off the note's own tags every time: delete it by hand and it comes back, answer the last axis and it goes.
- **Values compare exactly.** `domain/phd/wp1` does not answer `domain`; only `domain/phd` does.

Recent picks are offered first. No command has a hotkey.

### Installation

Requires Obsidian 1.13 or later. Download `main.js`, `manifest.json` and `styles.css` below into `.obsidian/plugins/loose-ends/` in your vault, enable **Loose Ends** under Settings → Community plugins, then add your axes and an unfiled tag in its settings.

### What it writes

The answer you pick, which replaces any other tag under that axis's namespace, and the unfiled tag, both only inside the notes folder. Every other frontmatter key, tag and word is kept. The one exception is a starter template, `Unfiled.md`, added to the template folder on a fresh install unless a file by that name is already there. It talks to nothing.
