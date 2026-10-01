# Security policy

## Supported versions

Security fixes go into the latest release of Loose Ends. Older releases don't
get separate fixes, so please update before you report.

## Reporting a problem

Please don't open a public issue for a security problem. Report it privately
through GitHub instead:

https://github.com/jorritvanderheide/obsidian-loose-ends/security/advisories/new

Include the Loose Ends and Obsidian versions, your operating system, and the
steps to reproduce it. Reports are looked at before anything about them is made
public.

## What counts

Loose Ends creates the notes you ask it for, writes tags on the notes in your
notes folder, and writes a starter template once. It connects to nothing and runs no programs. See the
[Safety section of the README](README.md#safety). Anything that makes it connect
somewhere, read or write files outside your vault, or run code that came from a
note or a template is a security problem.

A bug that changes or loses text in your notes is serious too, but it isn't
secret: please report that as a normal issue, so others can see it.
