# AGENTS.md template

Fill only the sections you have real facts for. Delete a section rather than leave a placeholder. Keep the whole file ≤100 lines.

Section order matters: models weight earlier instructions more, so commands and boundaries come first.

```markdown
# <Project name>

<One sentence: what this project is and who uses it. Skip if the name says it.>

## Commands

- Install: `<exact command>`
- Dev: `<exact command>`
- Build: `<exact command>`
- Test (all): `<exact command>`
- Test (single): `<exact command with placeholder, e.g. pnpm vitest run path/to/file.test.ts>`
- Lint / typecheck: `<exact command>`

## Stack

- <Runtime + version>, <framework + major version>, <package manager>
- <Only versions that change how code must be written>

## Project map

- `<dir>/` — <purpose, only if not obvious from the name>

## Conventions

- <Non-default rule the agent would otherwise get wrong>
- <Prefer a short real snippet over prose for patterns>

## Gotchas

- <Thing that broke before / quirk / required env var / ordering constraint>

## Boundaries

- Always: <e.g. run `<test command>` before declaring a task done>
- Ask first: <e.g. adding dependencies, DB migrations, changing public API>
- Never: <e.g. commit secrets or `.env*`; edit `<generated dir>/`; touch `<vendored/legacy zone>`>

## More context

- <Topic>: see `docs/<file>.md`   ← plain path, no @, so it loads lazily
```

## Greenfield variant

For an empty project, write only what is decided now (stack, package manager, planned commands, boundaries). Add this single comment at the end so the file grows deliberately:

```markdown
<!-- Grow this file only with facts the agent got wrong or could not infer. Re-run /agent-harness:audit after major changes. -->
```

(Claude Code strips HTML block comments before injecting the file, so the note costs Claude no context.)
