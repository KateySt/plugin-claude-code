---
name: agents-md-standards
description: Verified rules for writing AGENTS.md and CLAUDE.md context files — what to include, what to leave out, size budgets, the CLAUDE.md → @AGENTS.md import pattern, and how Claude Code, Cursor, Codex, Copilot, and Gemini CLI load these files. Use when writing, reviewing, or auditing AGENTS.md, CLAUDE.md, .claude/rules, or other agent context files.
user-invocable: false
---

# AGENTS.md / CLAUDE.md standards

Baseline verified on 2026-10-13 against Claude Code v2.1.296. Each rule cites its source. When a rule matters for a decision and may have changed, re-check the source.

## 1. File layout: AGENTS.md is the source of truth

- `AGENTS.md` holds all shared instructions. Cursor, Codex, GitHub Copilot, and (with config) Gemini CLI read it. [agents.md](https://agents.md/)
- `CLAUDE.md` is a thin shim: first line `@AGENTS.md`, then only Claude-specific notes (or nothing else). [Claude Code memory docs](https://code.claude.com/docs/en/memory#agents-md)
- Why the shim is required: Claude Code (v2.1.277+) reads AGENTS.md natively **only when no `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` exists** in the working directory or any parent. Any of those files silently disables AGENTS.md loading unless CLAUDE.md imports it. The import never loads the file twice. [memory docs](https://code.claude.com/docs/en/memory#agents-md)
- Never use a symlink `CLAUDE.md → AGENTS.md` on Windows. Creating it needs admin or Developer Mode, Git checks a symlink out as a one-line text file without `core.symlinks`, and Claude's Edit/Write tools refuse to write through symlinks. [memory docs](https://code.claude.com/docs/en/memory#agents-md)
- Claude Code ignores `AGENTS.local.md`, `AGENTS.override.md`, and `.agents/`. `AGENTS.override.md` is only meaningful to Codex. [memory docs](https://code.claude.com/docs/en/memory#agents-md), [Codex AGENTS.md docs](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- Personal, uncommitted notes go in `CLAUDE.local.md` (gitignored). Note that its presence also disables native AGENTS.md loading, so the committed CLAUDE.md must import `@AGENTS.md`.

## 2. What to include (things the agent cannot guess from the code)

Test for every line: **"Would removing this cause the agent to make mistakes?"** If not, cut it. [Claude Code best practices](https://code.claude.com/docs/en/best-practices)

Include, in this order of value:
1. **Commands** with exact flags: install, build, test (whole suite and a single test), lint, typecheck, run. Put them near the top. [GitHub: lessons from 2,500+ AGENTS.md files](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
2. **Stack with versions** where the version changes behavior (framework major, runtime, package manager).
3. **Non-default conventions**: style rules that differ from language defaults, naming, architecture decisions that aren't obvious from the code. [best practices](https://code.claude.com/docs/en/best-practices)
4. **Gotchas / environment quirks**: things that broke before, required env vars, ordering constraints.
5. **Boundaries**: Always / Ask first / Never. "Never commit secrets" is the most common. [GitHub blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
6. **Top-level map**: one line per top-level directory only when its purpose isn't obvious from its name.
7. **Verification**: how the agent proves a change works (which command must pass before finishing).

One real code snippet beats three paragraphs of description. [GitHub blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)

## 3. What to leave out

- Anything derivable from the code, file-by-file descriptions, full directory trees, dependency lists, architecture overviews. [best practices](https://code.claude.com/docs/en/best-practices)
- Standard language conventions and generic advice ("write clean code").
- Detailed API docs and tutorials — link them by path instead.
- Information that changes often.
- Rules a linter, formatter, or hook can enforce. Instructions are requests; a hook is a guarantee. [features overview](https://code.claude.com/docs/en/features-overview), [HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- Overuse of "IMPORTANT"/"MUST" — reserve emphasis for the one or two rules that really matter. [best practices](https://code.claude.com/docs/en/best-practices)

Evidence: context files on average do **not** raise agent task success and raise inference cost by 20%+; repository overviews don't help; files help when they document **non-standard practices**. [Gloaguen et al., "Evaluating AGENTS.md", arXiv 2602.11988](https://arxiv.org/abs/2602.11988). Instruction-following degrades as instruction count grows, with bias toward earlier instructions. [IFScale, arXiv 2507.11538](https://arxiv.org/abs/2507.11538)

## 4. Size budget

- Official: **under 200 lines per CLAUDE.md file**; Claude Code warns at startup and in `/status` when files exceed the recommended length. [memory docs](https://code.claude.com/docs/en/memory)
- This plugin's target: **≤100 lines for root AGENTS.md** (stricter house rule, not an official limit), hard ceiling 200.
- `@imports` are expanded eagerly at launch and **count against the budget** — they organize, they don't save context. Max import depth 4. [memory docs](https://code.claude.com/docs/en/memory), [issue #11759](https://github.com/anthropics/claude-code/issues/11759)
- Codex stops concatenating AGENTS.md files at `project_doc_max_bytes`, default 32 KiB combined. [Codex docs](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

## 5. Lazy loading: move detail out of the root file

From most eager to most lazy:
1. `@path` import — loads at start. Use only for small shared files.
2. Plain path mention without `@` ("see `docs/testing.md`") — the agent reads it only when relevant. Works in every tool.
3. Subdirectory `AGENTS.md` / `CLAUDE.md` — loads when the agent touches files in that directory. Only add one where conventions genuinely differ. In Claude Code a subdirectory AGENTS.md is skipped if the same directory has a CLAUDE.md. The VS Code extension had a reported bug not loading subdirectory files ([#24987](https://github.com/anthropics/claude-code/issues/24987), closed as stale, fix unconfirmed). VS Code Copilot nested AGENTS.md is experimental and off by default. [memory docs](https://code.claude.com/docs/en/memory), [VS Code docs](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
4. `.claude/rules/*.md` with `paths:` frontmatter — loads when a matching file is read or edited. Claude-only. [memory docs](https://code.claude.com/docs/en/memory)
5. Skills — only the description loads at start; body loads on relevance. Put multi-step procedures here, not in AGENTS.md. [skills docs](https://code.claude.com/docs/en/skills)

## 6. How each tool loads the files

| Tool | Reads AGENTS.md | Nesting | Notes |
|---|---|---|---|
| Claude Code | Yes, only if no CLAUDE.md/CLAUDE.local.md; else via `@AGENTS.md` import | Subdir files load on demand; ancestors concatenated root-first | `/config` → Project instructions can set `claude-md-and-agents-md` |
| Codex | Yes | One file per directory, root → cwd, nearer overrides; 32 KiB cap | `AGENTS.override.md` wins over AGENTS.md in the same dir |
| Cursor | Yes, root and subdirs | Nearer file wins | Also `.cursor/rules/*.mdc` (keep each rule < 500 lines) [Cursor docs](https://cursor.com/docs/context/rules) |
| GitHub Copilot | Yes (VS Code: `chat.useAgentsMdFile`) | Nested is experimental in VS Code | Sources are additive; don't rely on precedence [GitHub docs](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions) |
| Gemini CLI | Only if configured: `.gemini/settings.json` → `{"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}` | All found files concatenated | [Gemini CLI docs](https://geminicli.com/docs/cli/gemini-md/) |

Because some tools concatenate and others let the nearest file win, **files must never contradict each other**. Don't rely on precedence.

## 7. Claude-only content (goes in CLAUDE.md below the import, or in .claude/)

- Plan-mode or permission guidance specific to Claude Code.
- References to Claude skills, subagents, hooks, slash commands.
- Anything using Claude-only syntax (`@imports` beyond `@AGENTS.md`, `.claude/rules` mentions).

## 8. Built-in tools to recommend after setup

- `/context` — shows which memory files loaded.
- `/memory` — lists and opens memory files.
- `/doctor prompt-audit` (v2.1.283+) — checks for stale or conflicting instructions. [memory docs](https://code.claude.com/docs/en/memory)
- Manual check: open a new session, ask a question whose correct answer depends on the file, and confirm the answer uses it.
