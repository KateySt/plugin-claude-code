# kateyst-plugins

A Claude Code plugin marketplace for setting up repositories for agentic AI development.

## Install

```bash
claude plugin marketplace add KateySt/plugin-claude-code
claude plugin install agent-harness@kateyst-plugins
```

Or inside a session: `/plugin marketplace add KateySt/plugin-claude-code`, then `/plugin install agent-harness@kateyst-plugins`.

Private repository: Claude Code clones with your existing git credentials and never prompts. Either have an SSH key loaded in `ssh-agent`, or run `gh auth login && gh auth setup-git`. Without a GitHub SSH key, set `CLAUDE_CODE_PLUGIN_PREFER_HTTPS=1`.

Updates: auto-update is off by default. Turn it on in `/plugin` → Marketplaces → kateyst-plugins → Enable auto-update, or run `claude plugin update agent-harness@kateyst-plugins`.

## Plugins

### agent-harness

Makes `AGENTS.md` the single source of truth for every agent tool (Claude Code, Cursor, Codex, Copilot, Gemini CLI), with a thin `CLAUDE.md` that imports it via `@AGENTS.md`.

| Command | When |
|---|---|
| `/agent-harness:setup` | Empty new project, or existing code with no agent context. Interviews you (greenfield) or analyzes the repo (legacy), drafts the files, writes only after approval. |
| `/agent-harness:audit` | Project already has AGENTS.md/CLAUDE.md. Runs local checks, researches each finding on the live web, verifies every citation, and lets you pick which numbered suggestions to apply. |
| `/agent-harness:learnings [wrap-up\|review]` | `wrap-up` at the end of a session: saves non-obvious lessons (dead ends, gotchas, recurring errors) to `LEARNINGS.md` after you approve the diff. `review` from time to time: promotes repeated lessons into AGENTS.md, path-scoped `.claude/rules/`, skills, or hooks, and deletes stale ones. |

Inside the plugin:

```text
plugins/agent-harness/
├── .claude-plugin/plugin.json
├── skills/
│   ├── setup/                 user-invoked: generate AGENTS.md + CLAUDE.md
│   ├── audit/                 user-invoked: evidence-backed audit
│   ├── learnings/             capture session lessons, promote repeated ones
│   └── agents-md-standards/   shared rules with sources (loaded by the others)
└── agents/
    ├── repo-analyzer.md       read-only repo scan
    ├── evidence-researcher.md web research per topic, quotes + URLs
    └── citation-verifier.md   re-fetches every source, rejects unsupported claims
```

### sdd-engineering

Spec-driven development: a feature goes spec → research → plan → tests → implementation → architecture review → verification, each stage run by its own subagent, with EARS acceptance criteria and AC → task → test traceability. Installs `superpowers` (from `claude-plugins-official`) as a dependency.

```bash
claude plugin install sdd-engineering@kateyst-plugins
```

| Command | When |
|---|---|
| `/sdd-engineering:sdd <feature request>` | A feature that spans several files or has fuzzy requirements. Interviews you, writes the spec, stops for your approval of the spec and the plan, then runs tests-first implementation and independent verification. Resumes from `specs/<NNN>-<slug>/`. |

Details: [plugins/sdd-engineering/README.md](plugins/sdd-engineering/README.md).

## Develop

```bash
claude plugin validate --strict .                         # marketplace + plugin
claude plugin marketplace add ./                          # register local checkout
claude plugin install agent-harness@kateyst-plugins
```

With a local marketplace, edits load at the next session or after `/reload-plugins`.

## Release

GitHub → Actions → **Release plugin** → Run workflow → enter the plugin and the new version (e.g. `0.2.0`). The workflow:

1. bumps `version` in `plugins/<plugin>/.claude-plugin/plugin.json` on `main`,
2. validates, commits, and tags `<plugin>--v<version>` with `claude plugin tag`,
3. publishes a GitHub Release with generated notes.

How users get it: Claude Code decides updates by comparing the `version` in `plugin.json`, not by git tags. When auto-update is on, it refreshes the marketplace from `main` within ~10 minutes after the user's first message in a session, sees the new version, and installs it (`Run /reload-plugins to apply`). Without auto-update: `claude plugin update agent-harness@kateyst-plugins`. The tag marks the release and lets other plugins depend on version ranges like `^0.2`.

Rules:
- Set `version` only in `plugin.json`, never in the marketplace entry.
- Commits merged to `main` without a release are not delivered to existing users, but a fresh install gets whatever is on `main`. Keep unreleased work in branches.
- Never rename a plugin `name`; use `displayName`, or add a `renames` entry in `marketplace.json`.
