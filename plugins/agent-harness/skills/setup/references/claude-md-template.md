# CLAUDE.md template

CLAUDE.md is a shim. The import must be the first line. Everything shared lives in AGENTS.md.

Minimal (default):

```markdown
@AGENTS.md
```

With Claude-specific notes, only when there is real Claude-only content:

```markdown
@AGENTS.md

## Claude Code

- Use plan mode for changes under `<risky dir>/`.
- <Reference to a project skill, subagent, or hook, e.g. "Run /<skill> before releasing.">
```

Rules:
- Never duplicate AGENTS.md content here. Tools that read both would see it twice, and the copies drift.
- Never replace this file with a symlink (breaks on Windows and for Claude's Edit/Write tools).
- If the project already had a CLAUDE.md, move its shared content into AGENTS.md and keep only Claude-specific lines here.
