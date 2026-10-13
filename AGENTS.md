# kateyst-plugins

Claude Code plugin marketplace. No build step for plugins (Markdown and JSON); the catalog site in `site/` builds with Next.js.

## Commands

- Validate everything: `claude plugin validate --strict .`
- Validate one plugin: `claude plugin validate --strict ./plugins/<name>`
- Site (from repo root): `cd site && npm ci && npm test && npm run build`
- Local install test: `claude plugin marketplace add ./` then `claude plugin install <name>@kateyst-plugins`

## Map

- `.claude-plugin/marketplace.json` — catalog; every plugin needs an entry here.
- `site/` — GitHub Pages catalog (Next.js static export).
- `plugins/<name>/` — one plugin each; manifest in `.claude-plugin/plugin.json`, everything else at the plugin root.

## Conventions

- Plugin `name` in `marketplace.json` must equal `name` in the plugin's `plugin.json`.
- Relative `source` paths start with `./` and resolve from the repo root, not from `.claude-plugin/`. No `..`.
- New user-facing entry points are skills (`skills/<name>/SKILL.md`), not `commands/`.
- Reference plugin files from skill/agent bodies as `${CLAUDE_PLUGIN_ROOT}/...`, never relative paths.
- Every rule in `plugins/agent-harness/skills/agents-md-standards/SKILL.md` carries a source URL. Keep it that way.

## Boundaries

- Always: run `claude plugin validate --strict .` before finishing.
- Ask first: renaming any plugin `name` (breaks installs; use `displayName` or `renames`).
- Never: set `version` in both `plugin.json` and the marketplace entry; use names starting with `claude-`, `anthropic-`, or `cc-plugin-`; use symlinks for CLAUDE.md.

## Release

- Release only through the GitHub Actions workflow "Release plugin" (`.github/workflows/release.yml`): it bumps `plugin.json` `version`, tags `<plugin>--v<version>`, and creates a GitHub Release.
- Don't edit `version` by hand in feature work. Users receive updates only when `version` changes on `main`; tags alone don't trigger updates.
