# Development

## Setup

```sh
nix develop     # or any Node.js 20+
npm install
npm run dev     # rebuild on change
```

To try it in a vault, copy or link `main.js`, `manifest.json` and `styles.css`
into `<vault>/.obsidian/plugins/loose-ends/` and reload Obsidian, or turn the
plugin off and on again.

## Checks

```sh
npm test        # vitest
npm run lint    # eslint, with the Obsidian plugin's rules, failing on any warning
npm run build   # type check and production build
```

CI runs all three, on Node 24, for every push to `main` and every pull
request, and again before every release (`.github/workflows/ci.yml`). It also
runs `nix flake check`, which builds the plugin with Nix and runs its tests.
After a change to `package-lock.json`, update `npmDepsHash` in `flake.nix`, as
its comment says.

## Tests

Tests are in `tests/`, one per file in `src/core/`, named after it. See
[Architecture](architecture.md) for why nothing outside `core/` has one.

Anything that could lose a user's text or tags wants a test before it wants a
feature.

## Releasing

1. **Write the notes.** Rename `## Unreleased` in `CHANGELOG.md` to the new
   version.
2. **Bump the version:** `npm version <x.y.z>` updates `manifest.json` and
   `versions.json`. A version like `1.2.0-beta.1` becomes a pre-release, for
   beta testers.
3. **Push** the commit and a tag named for the version, without a `v`, to
   Codeberg. That is the only remote: GitHub mirrors it.
4. When the tag reaches GitHub, `.github/workflows/release.yml` runs the CI
   checks, makes sure the tag is the version in `manifest.json`, `package.json`
   and `versions.json`, and builds it without running any dependency's install
   script. It attests `main.js`, `manifest.json` and `styles.css`, and a second
   job, the only one that can write to the repository, puts them in a **draft**
   GitHub release named like "Loose Ends 1.5.1", with the version's part of
   `CHANGELOG.md` as its notes.
5. **Publish the draft.** Obsidian's community directory installs from GitHub
   releases, and a tag alone is not one.

Before releasing, check the changes against
[Compatibility](compatibility.md), which says what a minor or patch release
may not change. Before releasing anything that renames a setting, see
[Settings](settings.md#changing-the-shape).

## Updating an action

The workflows pin every action to a commit, with the version in a comment, so a
tag that is moved later can't change what builds a release. Nothing updates
them automatically, so look at them before a release. To move one to a newer
version, look up the commit the tag points to and replace both the hash and the
comment:

```sh
gh api repos/actions/checkout/commits/v6.1.0 --jq .sha
```

Both workflows also default to read-only. In the release workflow, the build job
asks only to sign the attestation, and the release job only to write the
release, which runs none of the repository's code.
