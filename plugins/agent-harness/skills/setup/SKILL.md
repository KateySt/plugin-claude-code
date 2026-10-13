---
name: setup
description: Set up a repository for agentic AI development by generating AGENTS.md (shared by Claude Code, Cursor, Codex, Copilot, Gemini) plus a thin CLAUDE.md that imports it. Handles empty new projects and existing legacy projects without agent context. Use when the user wants to create AGENTS.md or CLAUDE.md, bootstrap a project for AI agents, or "set up the harness".
argument-hint: "[path to project root, default: current directory]"
disable-model-invocation: true
---

# Set up AGENTS.md + CLAUDE.md

You generate a short, high-signal AGENTS.md and a CLAUDE.md shim. You write nothing until the user approves the drafts.

Before drafting, read the standards: `${CLAUDE_PLUGIN_ROOT}/skills/agents-md-standards/SKILL.md`. Every rule there applies. Templates: `${CLAUDE_PLUGIN_ROOT}/skills/setup/references/agents-md-template.md` and `${CLAUDE_PLUGIN_ROOT}/skills/setup/references/claude-md-template.md`.

Target project: `$ARGUMENTS` if given, otherwise the current working directory.

## Step 1: Detect the mode

Check for existing agent context files (use Glob, not shell): `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/`, `.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md`, `GEMINI.md`, `.windsurfrules`, `.clinerules`, and nested `**/AGENTS.md` / `**/CLAUDE.md` (excluding `node_modules`, `.git`, build output).

Then check for source code and project manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `*.csproj`, `Gemfile`, `composer.json`, etc.).

- **Existing setup** — AGENTS.md or CLAUDE.md already exists with real content: tell the user `/agent-harness:audit` is the right tool for improving an existing setup, and ask whether to switch to it or regenerate from scratch. Stop here unless they choose to regenerate.
- **Greenfield** — no manifests and no meaningful source files.
- **Legacy** — code exists, no AGENTS.md/CLAUDE.md. Other tools' files (`.cursorrules`, copilot instructions, etc.) count as input to migrate, not as an existing setup.

Tell the user which mode you detected in one line.

## Step 2a: Greenfield — interview

Nothing can be inferred from code, so ask. Use AskUserQuestion, at most 4 questions per call, two rounds at most:
1. Stack: language/runtime, framework, package manager (offer common choices, user can type their own).
2. Which agent tools the team uses (multiSelect: Claude Code, Cursor, Codex, Copilot, Gemini CLI). Gemini needs extra config.
3. Boundaries: what must agents never touch or always ask about (secrets, migrations, dependencies, specific folders).
4. Any conventions already decided (testing approach, commit style, code style beyond defaults).

Do not invent commands for tools that aren't installed yet. Write planned commands only if the user confirms them.

## Step 2b: Legacy — analyze, then fill gaps

Dispatch the `agent-harness:repo-analyzer` subagent with the project root. It returns stack, verified commands, map, conventions, gotchas, and open questions.

Migrate useful content from other tools' files (`.cursorrules`, `.cursor/rules`, copilot instructions, `GEMINI.md`): keep what passes the include test, drop the rest.

Then ask the user only what the code cannot tell you (AskUserQuestion, at most 4 per call): the analyzer's open questions, do-not-touch zones, which agent tools the team uses, and any known gotchas.

Command verification: list the commands you plan to document and ask whether you may run the fast ones (lint, typecheck, single test) to confirm they work. Never run commands that deploy, migrate, publish, or mutate external state. Mark any command you couldn't verify as such in your draft summary to the user, not in the file.

## Step 3: Draft

Write the drafts in the conversation, not to disk:
- `AGENTS.md` following the template. Root file ≤100 lines (hard ceiling 200). Commands first, boundaries included. No directory trees, dependency lists, or generic advice.
- `CLAUDE.md`: `@AGENTS.md` on the first line, plus a `## Claude Code` section only if there is real Claude-only content.
- Nested `AGENTS.md` only for subdirectories whose conventions genuinely differ (e.g. a monorepo package in another language). Default: none.
- If the user uses Gemini CLI: `.gemini/settings.json` with `{"context": {"fileName": ["AGENTS.md", "GEMINI.md"]}}` (merge into an existing file, don't overwrite).
- If `CLAUDE.local.md` is wanted for personal notes, ensure it's in `.gitignore`.

Before showing, self-check each AGENTS.md line against "would removing this cause the agent to make mistakes?" and cut what fails.

Show: the full drafts, the line count, and a short list of facts you could not verify.

## Step 4: Approve and write

Ask for approval (AskUserQuestion: write as shown / let me request changes / cancel). Apply requested changes and show the result again. Write files only after explicit approval. Never use a symlink for CLAUDE.md.

If a legacy project had a non-empty CLAUDE.md you are replacing, show what moves to AGENTS.md and what stays, and get approval for that too.

## Step 5: Hand off

Tell the user how to verify:
1. Start a new Claude Code session in the project and run `/context` to confirm AGENTS.md loaded through CLAUDE.md.
2. Ask a question whose answer depends on the file (e.g. "how do I run a single test?") and check the answer uses it.
3. Grow the file only with facts the agent got wrong. Run `/agent-harness:audit` after major changes.

Do not commit. Offer to commit if the user wants.
