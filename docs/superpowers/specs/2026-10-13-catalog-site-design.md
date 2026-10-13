# Marketplace catalog site — design

Status: draft · Date: 2026-10-13 · Owner: KateySt

## 1. Intent

A static site on GitHub Pages that lets people find and install anything in the `kateyst-plugins` marketplace without reading the repo. A visitor types what they need ("a skill for writing AGENTS.md", "spec driven"). The site matches keywords against every plugin, skill, agent, command, hook, and MCP server in the repo and shows matches as cards. From a card they copy the install command, or add plugins to a bundle and get a ready `.claude/settings.json` snippet for their team.

There is no backend. Everything is built from repo files at deploy time and served as static files.

## 2. Goals

1. Keyword search over all artifacts, results as cards, filterable by type and plugin, with shareable URLs.
2. A page per plugin and per artifact (skill, agent, command), rendered from the repo files.
3. A copy button with the install commands on every plugin card and page.
4. A bundle generator: pick plugins → copy a `.claude/settings.json` snippet (and the equivalent CLI commands).
5. Always current: rebuilt and redeployed on every push to `main` that touches plugins, the marketplace, or the site. It shows each plugin's current `version`.
6. Clean, reusable React code: small components, UI strings outside components, React best practices.

## 3. Non-goals

- Semantic or AI search, embeddings, LLM calls.
- Accounts, ratings, comments, install counters, anything needing a server or the GitHub API at runtime.
- Languages other than English (the string file allows adding one later, but no locale switching now).
- "Request a plugin" form, changelog page, trigger tester, `llms.txt`. These were considered and deferred.
- Editing plugins from the site.

## 4. Anti-goals

- UI text hard-coded inside components.
- Search that needs network access after page load (except loading the static index file).
- A catalog that drifts from the repo: hand-maintained data files, or a build that succeeds while silently skipping a plugin it failed to parse.
- Broken links or assets under the Pages sub-path (`/plugin-claude-code/`).
- Install snippets that don't work when pasted into Claude Code.

## 5. Constraints

- **Framework:** Next.js (current stable, App Router), TypeScript, static export (`output: 'export'`). No server features: no Server Actions, middleware, ISR, or dynamic route handlers. Route handlers only as `GET` with `dynamic = 'force-static'`.
- **Hosting:** GitHub Pages at `https://kateyst.github.io/plugin-claude-code/`, so `basePath: '/plugin-claude-code'` and `images.unoptimized: true`. The base path is configurable via env so local `next dev` works at `/`.
- **UI:** shadcn/ui components and Tailwind CSS.
- **Code style:**
  - Components split by responsibility and reusable.
  - Composition over boolean-prop variants (per `vercel-composition-patterns`).
  - Performance and rendering per `vercel-react-best-practices`: server components by default, client components only where interaction needs them.
- **Strings:** every user-visible string lives in `site/messages/en.json` and is read through a typed `t()` helper. No i18n library.
- **Location:** all site code in `site/` in this repo. The build reads plugin data from the repo root (`../.claude-plugin/`, `../plugins/`).
- **Repo rules (AGENTS.md):** English only. `claude plugin validate --strict .` must keep passing. The site must not add files under `plugins/` or change `.claude-plugin/`. AGENTS.md's "No build step" line is updated to say the site has one.

## 6. Data: the catalog

Built at build time by a loader in `site/lib/catalog/` from the repo:

| Source | Becomes |
|---|---|
| `.claude-plugin/marketplace.json` | marketplace name, owner, repo; one entry per plugin (name, source, description, category, tags) |
| `plugins/<p>/.claude-plugin/plugin.json` | displayName, version, description, keywords, dependencies, author, license |
| `plugins/<p>/skills/*/SKILL.md` | skill: frontmatter `name`, `description`, `argument-hint`, `disable-model-invocation`; Markdown body |
| `plugins/<p>/agents/*.md` | agent: `name`, `description`, `tools`, `model`; body |
| `plugins/<p>/commands/*.md` | command: name from file, `description`; body |
| `plugins/<p>/hooks/hooks.json` | hook events listed |
| `plugins/<p>/.mcp.json` | MCP server names |
| `plugins/<p>/README.md` | plugin page body, if present |

Each artifact gets:
- `id`: `<plugin>/<type>/<name>`
- `type`: `plugin`, `skill`, `agent`, `command`, `hook`, or `mcp`
- `plugin`
- `name`
- `title`: the invocation form, e.g. `/sdd-engineering:sdd` or `sdd-engineering:spec-creator`
- `description`
- `tags`: marketplace tags plus plugin keywords
- `body`: plain text for search
- `sourcePath`: the repo-relative file
- `url`: the site path

Skill flags:
- **`user-invocable: false`** (e.g. `agent-harness/skills/agents-md-standards`):
  - shown with a "Reference" badge;
  - title is `<plugin>:<skill>` without the leading `/`;
  - still searchable and has its page;
  - the page says it is loaded by other skills, not typed by users.
- **`disable-model-invocation: true`:** gets a "Manual only" badge.

Both flags are parsed by the loader and are part of the artifact type.

Only skills, agents, and commands get their own page. Hooks and MCP servers are shown on their plugin's page and appear in search results that link there.

**Fail loudly:** if any listed plugin's `plugin.json` or any artifact's frontmatter can't be parsed, the build fails with the file path. No silent skips.

**Search index:** a static JSON file, `search-index.json`, produced at build. It has only the fields search needs, so the full Markdown bodies aren't shipped twice.

## 7. Pages

| Route | Content |
|---|---|
| `/` | Header (marketplace name, one-line description, GitHub link), search box, type filter chips, plugin filter, results grid of cards. Empty query → all plugins first, then all artifacts grouped by plugin. "Add marketplace" command block. |
| `/plugins/[plugin]/` | Plugin header: displayName, version badge, category, tags, description, dependencies with their marketplace. Install command block (copy). "Add to bundle" toggle. Lists of its skills, agents, commands, hooks, MCP servers, each as a compact card. README rendered. "View source" link to the GitHub folder. |
| `/plugins/[plugin]/[type]/[name]/` | Artifact page, for skill, agent, and command only. Title in invocation form, type badge, plugin link, description, metadata (argument hint, tools, model), rendered body. "View source" link to the file on GitHub. Install block for the parent plugin. |
| `/bundle/` | Bundle generator (§9). |
| 404 | Static not-found page with a link home. |

Markdown rendering:
- GitHub-flavored Markdown with code highlighting.
- Relative links inside a plugin's files are rewritten to the GitHub blob URL.
- `${CLAUDE_PLUGIN_ROOT}` references are shown as-is.

## 8. Search

- **Engine:** MiniSearch in the browser, over `search-index.json`, loaded once on first focus of the search box or on load when `?q=` is present.
- **Fields and boosts:** `name` ×4, `title` ×3, `tags` ×2, `description` ×2, `body` ×1.
- **Matching:** prefix matching on, fuzzy matching `0.2`, combine terms with OR, ranked by score.
- **Query cleanup:** lowercase and strip stop words and request phrasing before searching. The list is in `site/lib/search/stopwords.ts` and covers words like "i", "need", "want", "a", "an", "the", "for", "to", "skill", "agent", "plugin", "something", "that", "which", "help", "me", "with". It strips "skill"/"agent"/"plugin" only when the query has other terms. When the query is only that word, it becomes a type filter instead ("agent" → type: agent).
- **Filters:** type chips (multi-select) and a plugin select, applied after search.
- **URL state:** `?q=&type=skill,agent&plugin=sdd-engineering`. It updates as the user types (debounced ~200 ms, `replaceState`) so any search can be shared. Reloading restores it.
- **Results:** cards in a responsive grid.
  - A card shows the type badge, invocation title, plugin name, version (for plugins), and description clamped to 3 lines.
  - Plugin cards also have the copy-install button and the bundle toggle.
- **No results:** a short message, plus a suggestion to clear filters if any are active.
- **Keyboard:** `/` focuses the search box, `Esc` clears it, and results are reachable with Tab.

## 9. Install commands and bundle generator

Install block for one plugin, copied as one text block:

```
claude plugin marketplace add KateySt/plugin-claude-code
claude plugin install <plugin>@kateyst-plugins
```

A tab next to it shows the in-session form (`/plugin marketplace add …`, `/plugin install …`). The repo slug and marketplace name come from the catalog, never hard-coded in components.

**Bundle generator:**
- Visitors toggle plugins into a bundle from cards, plugin pages, or a checklist on `/bundle/`.
- The bundle is stored in `localStorage` and mirrored in `/bundle/?plugins=a,b` so it can be shared.
- **A shared link differs from the saved bundle:**
  - On `/bundle/` the URL wins and is shown. Saved storage is not overwritten until the visitor edits the bundle or presses "Save as my bundle".
  - Elsewhere on the site, the saved bundle is used.
  - Unknown plugin names in the URL are ignored, with a notice.
- Output, with copy buttons, in two forms.

  Snippet for the project's `.claude/settings.json`:

  ```json
  {
    "extraKnownMarketplaces": {
      "kateyst-plugins": {
        "source": { "source": "github", "repo": "KateySt/plugin-claude-code" }
      }
    },
    "enabledPlugins": {
      "agent-harness@kateyst-plugins": true,
      "sdd-engineering@kateyst-plugins": true,
      "superpowers@claude-plugins-official": true
    }
  }
  ```

  - Include each selected plugin's dependencies in `enabledPlugins` under their own marketplace, as Claude Code writes them itself (confirmed against a real `--scope project` install on 2026-10-13).
  - `claude-plugins-official` is known to Claude Code by default, so it gets no `extraKnownMarketplaces` entry.

  The same bundle as CLI commands: one `marketplace add`, then one `claude plugin install … --scope project` per selected plugin.
- A short note under the snippet: teammates get these plugins after they trust the project folder.
- Empty bundle: show a hint to pick plugins, and no snippet.

## 10. Components and code structure (author's calls)

```
site/
├── app/                      # routes only; thin, compose components
│   ├── layout.tsx  page.tsx  not-found.tsx
│   ├── plugins/[plugin]/page.tsx
│   ├── plugins/[plugin]/[type]/[name]/page.tsx
│   ├── bundle/page.tsx
│   └── search-index.json/route.ts   # GET, force-static
├── components/
│   ├── ui/                   # shadcn primitives (generated)
│   ├── layout/               # SiteHeader, SiteFooter
│   ├── catalog/              # ArtifactCard (compound: Card.Header/Badge/Title/Description/Actions), TypeBadge, VersionBadge, ArtifactGrid, ArtifactList
│   ├── search/               # SearchBox, TypeFilter, PluginFilter, SearchResults, useCatalogSearch
│   ├── install/              # InstallBlock, CopyButton
│   ├── bundle/               # BundleProvider (context), BundleToggle, BundleChecklist, BundleOutput
│   └── markdown/             # Markdown renderer
├── lib/
│   ├── catalog/              # loader (fs, build-time only), types, url helpers
│   ├── search/               # index building, query cleanup, stopwords
│   ├── bundle/               # pure functions: settings snippet, CLI commands
│   └── i18n.ts               # t(key, vars) typed against messages/en.json
├── messages/en.json
└── tests/                    # mirrors lib/ and components/
```

- Pure logic (catalog parsing, query cleanup, bundle output) lives in `lib/` as plain functions with no React. These are the unit-tested core.
- `lib/catalog/` runs only at build time in server components and the index route, never in the client bundle.
- Bundle state goes through one `BundleProvider` context. Components read it via a hook; no prop drilling.
- Light and dark theme follow the OS setting, using shadcn's CSS variables. No toggle.

## 11. Quality

- **Unit tests:** Vitest. React Testing Library for interactive components (search, filters, copy, bundle).
- **Catalog loader:** tested against a small fixture marketplace in `site/tests/fixtures/` and once against the real repo. The real-repo test asserts that every marketplace plugin appears with its `plugin.json` version.
- **Bundle output:** tested to equal the exact JSON shape above for the two real plugins.
- **Build check:** `next build` succeeds with the Pages `basePath`. A post-build check fails if any internal `href`/`src` in `out/` lacks the base path.
- **Accessibility:** labeled search input, buttons with accessible names, visible focus, color contrast from the shadcn defaults.
- **Lint and typecheck:** ESLint (Next config) and `tsc --noEmit`.

## 12. Deploy

- New workflow `.github/workflows/pages.yml`:
  - Runs on push to `main` touching `site/**`, `plugins/**`, or `.claude-plugin/**`, and on `workflow_dispatch`.
  - Steps: Node 22 → `npm ci` in `site/` → lint, typecheck, test → `next build` → upload `site/out` with `actions/upload-pages-artifact` → `actions/deploy-pages`.
  - Permissions: `pages: write`, `id-token: write`, `contents: read`. Concurrency group `pages`.
- Release redeploy: `release.yml` pushes with `GITHUB_TOKEN`, and GitHub does not start other workflows from that push. So `pages.yml` also triggers on `workflow_run` of "Release plugin" (`types: [completed]`, only when it concluded `success`). `release.yml` is not edited.
- **One-time manual step for the owner:** repo Settings → Pages → Source: "GitHub Actions".
- `validate.yml` gets a `site` job that runs lint, typecheck, and test on PRs touching `site/**`.
- Root `README.md` links the site, and AGENTS.md lists the site commands.

## 13. Decisions made while writing (author, please check)

- Package manager npm, Node 22 (matches existing workflows).
- Hooks and MCP servers have no page of their own and appear on plugin pages.
- Bundle stored in localStorage plus the URL.
- Theme follows the OS, with no toggle.
- `search-index.json` is generated by a force-static route handler, not by a separate script.
- Search strips "skill"/"agent"/"plugin" words, or turns a bare one into a type filter.
- Pages redeploys after a release through a `workflow_run` trigger, not by editing `release.yml` or adding a token.
- `user-invocable: false` skills appear as "Reference" skills without a slash title.
- A shared bundle link wins on `/bundle/` without overwriting the visitor's saved bundle.

## 14. Left to the builder

Exact Next.js and shadcn versions (current stable at build time), visual styling within shadcn defaults, Markdown and highlight libraries, card layout details, and copy wording in `en.json`.
