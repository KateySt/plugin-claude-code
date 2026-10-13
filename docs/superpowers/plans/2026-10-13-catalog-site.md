# Catalog Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Next.js catalog of the `kateyst-plugins` marketplace on GitHub Pages: keyword search with cards, plugin and artifact pages, copy-install, and a bundle generator.

**Architecture:**
- Build-time loader (`site/lib/catalog`) reads repo files into a typed `Catalog`.
- Server components render pages from it. A force-static route emits `search-index.json`.
- Small client components handle search (MiniSearch), copy, and bundle state.
- Pure logic lives in `lib/`, is unit-tested, and has no React.

**Tech Stack:** Next.js (latest stable, App Router, `output: 'export'`), TypeScript, Tailwind + shadcn/ui, MiniSearch, gray-matter, react-markdown + remark-gfm + rehype-highlight, Vitest + React Testing Library, GitHub Actions Pages.

**Spec:** `docs/superpowers/specs/2026-10-13-catalog-site-design.md`

## Global Constraints

- All code, UI copy, and docs in English. Every user-visible string comes from `site/messages/en.json` through `t()`. No string literals in JSX except punctuation.
- Static export only. Allowed route handlers are `GET` + `export const dynamic = 'force-static'`. No Server Actions, middleware, or `headers()`/`cookies()`.
- Base path: `next.config.ts` reads `process.env.PAGES_BASE_PATH` (default `''`). CI sets `/plugin-claude-code`. `NEXT_PUBLIC_BASE_PATH` mirrors it for client `fetch`. Set `images.unoptimized: true` and `trailingSlash: true`.
- `site/lib/catalog/**` imports `node:fs`. It may be imported only by server components, `generateStaticParams`, and route handlers, never by a `'use client'` file. Enforce with `import 'server-only'` at the top of `lib/catalog/index.ts`.
- React rules (skills `vercel-react-best-practices`, `vercel-composition-patterns`; load both before Task 5):
  - Server components by default; `'use client'` only on leaf interactive components.
  - Compound components instead of boolean-prop variants.
  - No prop drilling of bundle state; use the context.
- npm, Node 22. All commands run from `site/` unless stated.
- Never write under `plugins/` or `.claude-plugin/`. The root gate `claude plugin validate --strict .` keeps passing.
- Branch `feat/catalog-site` (already created from `origin/main` at `bcfa02d`). Commit per task with explicit pathspecs.
- Test gate for every task: `npm run lint && npm run typecheck && npm test`. From Task 8 on, also `npm run build`.

## Review Focus

1. **Base path in production.** `fetch('/search-index.json')`, `<img>`, and raw `<a>` tags break under `/plugin-claude-code/`. Task 9 adds a post-build check (`scripts/check-base-path.mjs`) that fails on any root-relative `href`/`src` in `out/**/*.html` missing the prefix. Task 7 tests that the index URL includes `NEXT_PUBLIC_BASE_PATH`.
2. **A query made only of filler words** ("I need a skill"). It must show all skills, not an empty page. Pinned in Task 3: `cleanQuery('I need a skill')` → `{ terms: '', typeFilter: 'skill' }`. In Task 7, empty terms plus a filter list everything of that type.
3. **A plugin with no `skills/`, `agents/`, `commands/`, or README.** The loader must not throw on missing folders. It throws only on unparseable files. Pinned in Task 2 with fixture plugin `bare`.
4. **Markdown links and images.**
   - Relative links in SKILL/README files point to the GitHub blob URL.
   - Absolute and `#anchor` links stay unchanged.
   - `${CLAUDE_PLUGIN_ROOT}/…` text is left as text.
   - Pinned in Task 5 `rewriteRelativeLink` tests.
5. **Bundle URL junk.** `?plugins=` empty, duplicates, unknown names, and stray spaces. Pinned in Task 4 `parseBundleParam` tests.

---

### Task 1: Scaffold Next.js app, config, i18n, test runner

**Files:**
- Create: `site/` via create-next-app.
- Create: `site/next.config.ts`, `site/vitest.config.ts`, `site/vitest.setup.ts`
- Create: `site/messages/en.json`, `site/lib/i18n.ts`, `site/tests/lib/i18n.test.ts`
- Modify: `site/package.json` scripts
- Modify: root `.gitignore` (add `site/node_modules`, `site/.next`, `site/out`)

**Interfaces:**
- Produces: `t(key: MessageKey, vars?: Record<string, string | number>): string`.
  - `MessageKey` is the union of dot paths of string leaves in `en.json`, typed from the JSON import.
  - Missing var → leave `{name}` in place.
- Produces: npm scripts `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`).

- [ ] **Step 1: Scaffold**

Run from the repo root:
```bash
npx create-next-app@latest site --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```
Then, in `site/`:
```bash
npx shadcn@latest init -d
npm i minisearch gray-matter react-markdown remark-gfm rehype-highlight server-only
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```
Set `next.config.ts`: `output: 'export'`, `basePath`, `env.NEXT_PUBLIC_BASE_PATH`, `images.unoptimized`, `trailingSlash: true`. Delete the template's demo content from `app/page.tsx`.

- [ ] **Step 2: Write the failing test** `tests/lib/i18n.test.ts`
  - `t('site.title')` returns the `en.json` value.
  - `t('search.resultsCount', { count: 3 })` returns `'3 results'` (`en.json`: `"resultsCount": "{count} results"`).
  - A var missing from `vars` leaves the `{placeholder}` literally.

- [ ] **Step 3: Run it.** `npm test`. Expected: FAIL, cannot find `@/lib/i18n`.

- [ ] **Step 4: Implement `lib/i18n.ts`**, and seed `en.json` with the `site`, `search`, `install`, `bundle`, `catalog`, `artifact`, and `notFound` groups. Later tasks add their keys.

- [ ] **Step 5: Run the gate and a build.** `npm run lint && npm run typecheck && npm test && PAGES_BASE_PATH=/plugin-claude-code npm run build`. Expected: all pass, and `out/index.html` exists.

- [ ] **Step 6: Commit** `git add site .gitignore`, then `git commit -m "feat(site): scaffold Next.js static site with i18n and vitest" -- site .gitignore`.

### Task 2: Catalog loader

**Files:**
- Create: `site/lib/catalog/types.ts`, `site/lib/catalog/load.ts`, `site/lib/catalog/urls.ts`, `site/lib/catalog/index.ts`
- Create: `site/tests/fixtures/repo/` with a fixture marketplace:
  - `.claude-plugin/marketplace.json` listing `alpha` and `bare`
  - `plugins/alpha` with one normal skill, one skill with `user-invocable: false`, one agent, one command, `hooks/hooks.json`, `.mcp.json`, and a README
  - `plugins/bare` with only `plugin.json`
- Create: `site/tests/fixtures/broken/`, the same as `repo/` but with invalid YAML frontmatter in one SKILL.md
- Create: `site/tests/lib/catalog.test.ts`

**Interfaces (Produces):**
```ts
export type ArtifactType = 'plugin' | 'skill' | 'agent' | 'command' | 'hook' | 'mcp'
export interface Artifact {
  id: string            // `${plugin}/${type}/${name}`; plugin artifact: `${plugin}/plugin/${plugin}`
  type: ArtifactType
  plugin: string
  name: string
  title: string         // skill: `/${plugin}:${name}` or `${plugin}:${name}` if referenceOnly; agent: `${plugin}:${name}`; command: `/${plugin}:${name}`; plugin: displayName ?? name; hook: event name; mcp: server name
  description: string
  tags: string[]
  body: string          // raw Markdown body ('' for hook/mcp/plugin)
  sourcePath: string    // repo-relative, forward slashes
  url: string           // site path without basePath, trailing slash; hook/mcp → their plugin's url
  referenceOnly: boolean   // skill with user-invocable: false
  manualOnly: boolean      // skill with disable-model-invocation: true
  meta: Record<string, string> // argument-hint, tools, model when present
}
export interface PluginInfo {
  name: string; displayName: string; version: string; description: string
  category?: string; tags: string[]; license?: string; author?: string
  dependencies: { name: string; marketplace: string }[]  // bare string dep → marketplace = own marketplace name
  readme?: string; sourcePath: string; url: string; artifacts: Artifact[] // non-plugin artifacts of this plugin
}
export interface Catalog {
  marketplace: { name: string; description: string; repo: string /* "Owner/repo" */; repoUrl: string }
  plugins: PluginInfo[]
  artifacts: Artifact[]  // every artifact incl. one 'plugin' artifact per plugin
}
export class CatalogError extends Error { constructor(public file: string, message: string) }
export function loadCatalog(repoRoot: string): Catalog            // sync, fs-based
export function getCatalog(): Catalog                              // index.ts: memoized loadCatalog(path.resolve(process.cwd(), '..'))
export function pluginUrl(plugin: string): string                  // `/plugins/${plugin}/`
export function artifactUrl(plugin: string, type: 'skill'|'agent'|'command', name: string): string // `/plugins/${plugin}/${type}/${name}/`
export function githubBlobUrl(repoUrl: string, path: string): string // `${repoUrl}/blob/main/${path}`
export function githubTreeUrl(repoUrl: string, path: string): string // `${repoUrl}/tree/main/${path}`
```
- `repo` and `repoUrl` come from the `repository` field of the plugins' `plugin.json` files. All plugins with relative sources must agree, otherwise `CatalogError`.
- `tags` = marketplace entry `tags` ∪ plugin `keywords`, deduplicated.

- [ ] **Step 1: Write failing tests** in `catalog.test.ts`, against the fixture repo:
  - Both plugins load, and `bare` has `artifacts: []`.
  - The `alpha` skill title is `/alpha:<name>`. The reference skill title is `alpha:<name>` with `referenceOnly: true`.
  - The agent's `meta.tools` equals its frontmatter.
  - The hook artifact's `url` equals `pluginUrl('alpha')`.
  - Tags are merged and deduplicated.
  - A string dependency gets the own marketplace name.
  - `loadCatalog(brokenFixture)` throws `CatalogError` whose `file` ends with the broken `SKILL.md` path.
  - Against the real repo (`path.resolve(__dirname, '../../..')`):
    - every `marketplace.json` plugin name is present;
    - each `version` equals its `plugin.json`;
    - `sdd-engineering` has 7 agents and 1 skill.

- [ ] **Step 2: Run.** `npm test -- catalog`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement** `types.ts`, `urls.ts`, `load.ts` (gray-matter for frontmatter, `fs.readdirSync`, missing directories are skipped), and `index.ts` (`import 'server-only'`, memoized `getCatalog`). Vitest can't import `server-only`, so alias it to an empty module in `vitest.config.ts`.

- [ ] **Step 4: Run.** `npm test -- catalog`. Expected: PASS. Then run the full gate.

- [ ] **Step 5: Commit** `feat(site): build-time catalog loader with fixtures`.

### Task 3: Search logic

**Files:**
- Create: `site/lib/search/stopwords.ts`, `site/lib/search/query.ts`, `site/lib/search/index-docs.ts`, `site/lib/search/engine.ts`
- Test: `site/tests/lib/search.test.ts`

**Interfaces (Produces):**
```ts
export interface SearchDoc { id: string; type: ArtifactType; plugin: string; name: string; title: string; description: string; tags: string; body: string; url: string; version?: string; referenceOnly: boolean; manualOnly: boolean }
export function toSearchDocs(catalog: Catalog): SearchDoc[]   // tags joined by ' '; body stripped of Markdown syntax and truncated to 4000 chars; version only on plugin docs
export function cleanQuery(raw: string): { terms: string; typeFilter?: ArtifactType }
export interface SearchFilters { types: ArtifactType[]; plugin?: string }
export function createSearch(docs: SearchDoc[]): (query: string, filters: SearchFilters) => SearchDoc[]
```
Engine settings:
- MiniSearch `fields: ['name','title','tags','description','body']`, `storeFields`: everything `SearchDoc` needs to render a card;
- boosts `{ name: 4, title: 3, tags: 2, description: 2, body: 1 }`, `prefix: true`, `fuzzy: 0.2`, `combineWith: 'OR'`.
- Empty `terms` returns all docs that pass the filters, ordered plugins first, then by plugin and type order skill, agent, command, hook, mcp, then name.
- `cleanQuery`'s `typeFilter` is merged into `filters.types` by the caller (Task 7).

- [ ] **Step 1: Write failing tests**
  - `cleanQuery('I need a skill for writing AGENTS.md')` → `{ terms: 'writing agents.md' }`
  - `cleanQuery('I need a skill')` → `{ terms: '', typeFilter: 'skill' }`
  - `cleanQuery('agent')` → `{ terms: '', typeFilter: 'agent' }`
  - `cleanQuery('  Spec   Driven ')` → `{ terms: 'spec driven' }`
  - Over the real catalog:
    - `search('spec driven', {types: []})[0].plugin === 'sdd-engineering'`;
    - `search('agents.md', {types: ['skill']})` contains `agent-harness/skill/setup` and contains no agents;
    - `search('', {types: ['agent'], plugin: 'sdd-engineering'}).length === 7`;
    - `search('spek', {types: []})` (typo) has at least one `sdd-engineering` result.

- [ ] **Step 2: Run.** Expected: FAIL.

- [ ] **Step 3: Implement** the four files.

- [ ] **Step 4: Run.** Expected: PASS. Then run the full gate.

- [ ] **Step 5: Commit** `feat(site): keyword search with query cleanup`.

### Task 4: Bundle logic

**Files:**
- Create: `site/lib/bundle/settings.ts`, `site/lib/bundle/param.ts`
- Test: `site/tests/lib/bundle.test.ts`

**Interfaces (Produces):**
```ts
export interface BundleSource { marketplaceName: string; repo: string; plugins: { name: string; dependencies: { name: string; marketplace: string }[] }[] }
export function bundleSettings(selected: string[], src: BundleSource): { extraKnownMarketplaces: Record<string, { source: { source: 'github'; repo: string } }>; enabledPlugins: Record<string, true> }
export function bundleCommands(selected: string[], src: BundleSource): string[]
export function bundleSourceFrom(catalog: Catalog): BundleSource
export function parseBundleParam(value: string | null, known: string[]): { plugins: string[]; unknown: string[] }
export function serializeBundleParam(plugins: string[]): string
```
Rules:
- `enabledPlugins` keys are the selected plugins `name@marketplaceName`, plus each dependency as `name@marketplace`. Keys are sorted, with no duplicates.
- `extraKnownMarketplaces` has only our marketplace. Never add `claude-plugins-official`.
- `bundleCommands` returns `claude plugin marketplace add <repo>`, then `claude plugin install <p>@<marketplaceName> --scope project` per selected plugin, in sorted order.
- `parseBundleParam` splits on commas, trims, drops empties, deduplicates, keeps known names in input order, and returns unknown names separately.
- `serializeBundleParam` sorts and joins with `,`.

- [ ] **Step 1: Write failing tests**
  - `bundleSettings(['sdd-engineering','agent-harness'], bundleSourceFrom(realCatalog))` deep-equals the exact JSON in spec §9.
  - `bundleSettings([], …)` gives an empty `enabledPlugins`.
  - `bundleCommands(['agent-harness'], …)` equals `['claude plugin marketplace add KateySt/plugin-claude-code', 'claude plugin install agent-harness@kateyst-plugins --scope project']`.
  - `parseBundleParam(' a, ,b,a,zzz ', ['a','b'])` → `{ plugins: ['a','b'], unknown: ['zzz'] }`, and `parseBundleParam(null, ['a'])` → `{ plugins: [], unknown: [] }`.

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** both files.
- [ ] **Step 4: Run.** Expected: PASS. Then run the full gate.
- [ ] **Step 5: Commit** `feat(site): bundle settings and CLI command generation`.

### Task 5: Shared UI components

Load skills `vercel-react-best-practices` and `vercel-composition-patterns` before this task.

**Files:**
- Create: `site/lib/markdown/links.ts`, `site/components/markdown/Markdown.tsx`
- Create: `site/components/install/CopyButton.tsx` (client), `site/components/install/InstallBlock.tsx` (client: CLI/in-session tabs)
- Create: `site/components/catalog/TypeBadge.tsx`, `VersionBadge.tsx`, `ArtifactCard.tsx` (compound: `ArtifactCard`, `.Header`, `.Title`, `.Meta`, `.Description`, `.Actions`), `ArtifactGrid.tsx`
- Add shadcn primitives as needed (`button`, `badge`, `card`, `tabs`, `input`, `toggle`, `select`, `checkbox`)
- Test: `site/tests/lib/markdown.test.ts`, `site/tests/components/install.test.tsx`, `site/tests/components/card.test.tsx`

**Interfaces (Produces):**
- `rewriteRelativeLink(href: string, sourcePath: string, repoUrl: string): string`
- `<Markdown source={string} sourcePath={string} repoUrl={string} />`
- `<CopyButton text={string} label={MessageKey} />`
  - Uses `navigator.clipboard.writeText`.
  - Shows `t('install.copied')` for 2 s.
  - Falls back to selecting the text if the clipboard API is missing.
- `<InstallBlock repo={string} marketplaceName={string} plugin={string} />`
- `<TypeBadge type={ArtifactType} referenceOnly? manualOnly? />`

- [ ] **Step 1: Write failing tests**
  - `rewriteRelativeLink('references/a.md', 'plugins/p/skills/s/SKILL.md', R)` → `${R}/blob/main/plugins/p/skills/s/references/a.md`.
  - `rewriteRelativeLink('../x.md', …)` resolves up one level.
  - `https://…`, `#top`, and `mailto:` links stay unchanged.
  - `InstallBlock` renders exactly the two CLI lines from spec §9 for `plugin='sdd-engineering'`. The in-session tab shows the `/plugin …` lines.
  - Clicking `CopyButton` calls `clipboard.writeText` with the block text and then shows the copied label.
  - `TypeBadge` with `referenceOnly` shows `t('catalog.badge.reference')`.

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Components contain no string literals and get every string via `t()`. `ArtifactCard` takes children, not variant booleans.
- [ ] **Step 4: Run.** Expected: PASS. Then run the full gate.
- [ ] **Step 5: Commit** `feat(site): shared catalog, install and markdown components`.

### Task 6: Bundle state and `/bundle/` page

**Files:**
- Create: `site/components/bundle/BundleProvider.tsx` (client context), `BundleToggle.tsx`, `BundleChecklist.tsx`, `BundleOutput.tsx`
- Create: `site/app/bundle/page.tsx`
- Modify: `site/app/layout.tsx` (wrap in `BundleProvider`, passing `bundleSourceFrom(getCatalog())` as a prop)
- Test: `site/tests/components/bundle.test.tsx`

**Interfaces:**
- Consumes: Task 4 functions, Task 5 `CopyButton`.
- Produces: `useBundle(): { plugins: string[]; toggle(name: string): void; has(name: string): boolean; save(): void; source: BundleSource; fromUrl: boolean; unknown: string[] }`
- localStorage key: `kateyst-plugins:bundle`.
- On `/bundle/` with a `?plugins=` param: state comes from the URL (`fromUrl: true`). Storage is written only on `toggle` or `save`. Each toggle updates the URL with `history.replaceState`. Elsewhere, state comes from storage.

- [ ] **Step 1: Write failing tests** (jsdom, provider rendered with the real `BundleSource`):
  - Toggling `agent-harness` makes `BundleOutput` show JSON containing `"agent-harness@kateyst-plugins": true` and writes storage.
  - Rendering with `?plugins=sdd-engineering,zzz` and stored `["agent-harness"]`:
    - the output shows `sdd-engineering` and the superpowers dependency;
    - an unknown-name notice is shown;
    - storage still equals `["agent-harness"]` until `save()`.
  - An empty bundle shows `t('bundle.empty')` and no `<pre>`.

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Read `useSearchParams` inside a `<Suspense>` boundary, as static export requires.
- [ ] **Step 4: Run.** Expected: PASS. Then run the full gate.
- [ ] **Step 5: Commit** `feat(site): bundle generator with shareable URL`.

### Task 7: Search UI, home page, search index route

**Files:**
- Create: `site/app/search-index.json/route.ts`. GET, force-static; returns `toSearchDocs(getCatalog())`.
- Create: `site/components/search/useCatalogSearch.ts` (client hook), `SearchBox.tsx`, `TypeFilter.tsx`, `PluginFilter.tsx`, `SearchResults.tsx`, `SearchPage.tsx` (client shell)
- Create: `site/components/layout/SiteHeader.tsx`, `SiteFooter.tsx`
- Modify: `site/app/page.tsx` (server). It renders the header, an add-marketplace `InstallBlock`-style command, and `<SearchPage plugins={…} />` inside `<Suspense>`.
- Test: `site/tests/components/search.test.tsx`

**Interfaces:**
- Consumes: Task 3 `createSearch` and `cleanQuery`, Task 5 `ArtifactCard` and `TypeBadge`, Task 6 `BundleToggle`.
- Produces: `useCatalogSearch(): { query: string; setQuery(q: string): void; types: ArtifactType[]; toggleType(t: ArtifactType): void; plugin?: string; setPlugin(p?: string): void; results: SearchDoc[]; status: 'idle' | 'loading' | 'ready' | 'error' }`
  - Fetches `${process.env.NEXT_PUBLIC_BASE_PATH}/search-index.json` once.
  - Syncs `?q=&type=&plugin=` with `history.replaceState`, debounced 200 ms.
  - Restores state from the URL on load.
  - `cleanQuery`'s `typeFilter` is added to the active types.
- Keyboard: `/` focuses the input (ignored while typing in another field), `Esc` clears it.

- [ ] **Step 1: Write failing tests** (mock `fetch` to return `toSearchDocs` of the real catalog):
  - Typing `spec driven` renders an `sdd-engineering` card first.
  - Checking the `agent` chip and choosing plugin `sdd-engineering` renders 7 cards.
  - Typing `I need a skill` renders only skill cards, more than 0.
  - A no-match query renders `t('search.noResults')`. With an active filter, it also renders `t('search.clearFilters')`.
  - The fetch URL equals `${NEXT_PUBLIC_BASE_PATH}/search-index.json` (set to `/x` in the test).
  - The URL updates to `?q=spec+driven` after the debounce.

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS. Then run the full gate, plus `PAGES_BASE_PATH=/plugin-claude-code npm run build`, plus a check that `out/search-index.json` exists and parses.
- [ ] **Step 5: Commit** `feat(site): home page with keyword search and filters`.

### Task 8: Plugin pages, artifact pages, 404

**Files:**
- Create: `site/app/plugins/[plugin]/page.tsx`, `site/app/plugins/[plugin]/[type]/[name]/page.tsx`, `site/app/not-found.tsx`
- Create: `site/components/catalog/PluginHeader.tsx`, `ArtifactList.tsx`, `ArtifactMeta.tsx`
- Test: `site/tests/app/pages.test.tsx` (render the server components as async functions with a real-catalog `params` promise)

**Interfaces:**
- `generateStaticParams` returns:
  - plugin pages: every `catalog.plugins` name;
  - artifact pages: every skill, agent, and command `{ plugin, type, name }`.
- `dynamicParams = false` on both routes.
- Page metadata: `generateMetadata` → `title: "<title> · <marketplace name>"`, `description`.

- [ ] **Step 1: Write failing tests**
  - The `sdd-engineering` plugin page shows:
    - version badge `0.0.0`, or whatever the real `plugin.json` says (read it in the test, never hard-code);
    - 7 agent rows and 1 skill row;
    - the superpowers dependency labeled `claude-plugins-official`;
    - an `InstallBlock`;
    - a "View source" link equal to `githubTreeUrl(repoUrl, 'plugins/sdd-engineering')`.
  - The `agent-harness/skill/agents-md-standards` page shows the Reference badge and a title without `/`.
  - The `sdd-engineering/agent/test-writer` page shows `meta.tools`.
  - `generateStaticParams` for artifacts equals the catalog's skill + agent + command count. Today that's 15: 4 skills and 3 agents in agent-harness, plus 1 skill and 7 agents in sdd-engineering. Compute the expected count from the catalog in the test, never hard-code it, and assert there are no hook or mcp types.

- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the full gate and `PAGES_BASE_PATH=/plugin-claude-code npm run build`. Expected: `out/plugins/sdd-engineering/index.html` and `out/plugins/sdd-engineering/agent/test-writer/index.html` exist.
- [ ] **Step 5: Commit** `feat(site): plugin and artifact pages`.

### Task 9: Base-path check, deploy workflow, CI, docs

**Files:**
- Create: `site/scripts/check-base-path.mjs`, `site/tests/scripts/check-base-path.test.ts`
- Create: `.github/workflows/pages.yml`
- Modify: `.github/workflows/validate.yml` (add `site` job)
- Modify: `README.md` (site link near the top; also fix the stale "Private repository" paragraph. The repo is public now, so keep only the `CLAUDE_CODE_PLUGIN_PREFER_HTTPS` hint.)
- Modify: `AGENTS.md`:
  - "No build step" → "No build step for plugins; the catalog site in `site/` builds with Next.js".
  - Commands: `cd site && npm ci && npm test && npm run build`.
  - Map line: `site/` — GitHub Pages catalog.

**Interfaces:**
- `checkBasePath(outDir: string, basePath: string): string[]` returns offending `file: attr=value` lines. Offenders are root-relative `href`/`src` values that don't start with `basePath` (`//` and external URLs are ignored).
- The CLI runs `node scripts/check-base-path.mjs out /plugin-claude-code` and exits 1 if anything is listed.
- npm script `postbuild:check`.

- [ ] **Step 1: Write the failing test.** Use a temp `out/` with one HTML file containing `href="/plugins/x/"` and `src="/plugin-claude-code/a.png"`. `checkBasePath` returns exactly one offender, the `href`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the script, then run it against the real build. Expected: no offenders.
- [ ] **Step 4: Write `pages.yml`** as specified in spec §12. Triggers:
  - `push` to `main` with paths `site/**`, `plugins/**`, `.claude-plugin/**`;
  - `workflow_dispatch`;
  - `workflow_run` on workflows `["Release plugin"]` with `types: [completed]`; the job runs only `if: github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success'`.

  Build env: `PAGES_BASE_PATH=/plugin-claude-code`. Steps: checkout, setup-node 22 with npm cache on `site/package-lock.json`, `npm ci`, lint, typecheck, test, build, `npm run postbuild:check`, `actions/configure-pages`, `actions/upload-pages-artifact` (`path: site/out`), `actions/deploy-pages`.

  Add a `site` job to `validate.yml`, gated on PR paths `site/**`: `npm ci`, lint, typecheck, test, build.
- [ ] **Step 5: Update README.md and AGENTS.md** as listed. Run from the repo root: `claude plugin validate --strict .`. Expected: `Validation passed`.
- [ ] **Step 6: Full verification.** Run the gate, the build, and `postbuild:check`. Then start a local preview of `out/`, for example `npx serve out` run from a parent folder mapped to `/plugin-claude-code/`, or the build with `PAGES_BASE_PATH=` empty. Open home, search "spec", open the plugin page, toggle the bundle, and open `/bundle/`. Use Playwright MCP for screenshots of each.
- [ ] **Step 7: Commit** `ci(site): GitHub Pages deploy, base-path check, docs`.

After merge, the owner does one manual step: repo Settings → Pages → Source: **GitHub Actions**.
