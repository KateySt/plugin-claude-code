# Catalog site

Static Next.js 16 site (GitHub Pages) that lists the plugins, skills, agents, and commands in this marketplace. It reads `.claude-plugin/marketplace.json` and `plugins/` at build time; nothing is fetched at runtime.

## Commands

Run from `site/`:

```bash
npm ci
npm run dev             # local dev server
npm run lint && npm run typecheck && npm test
npm run build           # static export to out/
npm run postbuild:check # fail if a root-relative href/src lacks the base path
```

## Base path

`PAGES_BASE_PATH` sets the base path (default empty). CI uses `/plugin-claude-code`:

```bash
MSYS_NO_PATHCONV=1 PAGES_BASE_PATH=/plugin-claude-code npm run build && npm run postbuild:check
```

`NEXT_PUBLIC_BASE_PATH` mirrors it for client-side `fetch`. User-visible strings live in `messages/en.json`.

## Deploy

`.github/workflows/pages.yml` builds and deploys on pushes to `main` that touch `site/`, `plugins/`, or `.claude-plugin/`, after a successful "Release plugin" run, and on manual dispatch. One-time setup: repo Settings, Pages, Source: GitHub Actions.
