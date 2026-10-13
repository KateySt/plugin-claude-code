---
name: audit
description: Audit an existing agent setup (AGENTS.md, CLAUDE.md, .claude/rules, Cursor/Copilot/Gemini instruction files) and propose improvements where every suggestion is backed by a live-researched, verified source with a quote and URL. Proposes changes and applies only the ones the user picks. Use when the user wants to review, improve, or modernize an existing AGENTS.md/CLAUDE.md or AI-agent setup.
argument-hint: "[path to project root, default: current directory]"
disable-model-invocation: true
---

# Evidence-based audit of an agent setup

You find what is wrong or improvable in the project's agent context, back each suggestion with a verified external source, and let the user choose what to apply. You change nothing before the user picks.

Read first: `${CLAUDE_PLUGIN_ROOT}/skills/agents-md-standards/SKILL.md` (the baseline rules) and `${CLAUDE_PLUGIN_ROOT}/skills/audit/references/checks.md` (the local checks).

Target project: `$ARGUMENTS` if given, otherwise the current working directory.

## Step 1: Inventory

Find every agent context file with Glob: `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md` and nested `**/AGENTS.md`, `**/CLAUDE.md` (exclude `node_modules`, `.git`, build output), `.claude/rules/**`, `.claude/skills/**/SKILL.md`, `.claude/agents/*.md`, `.claude/settings.json` (hooks only), `.cursor/rules/**`, `.cursorrules`, `.github/copilot-instructions.md`, `.github/instructions/**`, `GEMINI.md`, `.gemini/settings.json`.

Read them. Run `claude --version` to note the installed Claude Code version. Check whether CLAUDE.md is a symlink (`git ls-files -s CLAUDE.md` shows mode `120000` for a symlink).

If no AGENTS.md or CLAUDE.md exists, tell the user `/agent-harness:setup` fits better and stop unless they want to continue.

## Step 2: Ground truth

Dispatch the `agent-harness:repo-analyzer` subagent on the project root. Its report (real commands, stack, paths) is what you compare the context files against for checks C1–C3.

## Step 3: Local checks

Run every check in `checks.md`. Record each finding with check ID, `file:line`, a one-line description, and severity. Do this yourself; it needs no web access.

## Step 4: Research

Group findings into 2–4 research topics (for example: "Claude Code loading and imports", "content and size", "cross-tool compatibility", "harness: hooks, rules, skills"). Also add one topic "what changed recently" so the audit catches new practices the baseline doesn't know about: new Claude Code / AGENTS.md / Codex / Cursor features relevant to this project's setup, released in the last 6 months.

Dispatch one `agent-harness:evidence-researcher` subagent per topic, **in parallel in a single message**. Give each: the topic, the relevant findings (ID, file:line, description, the exact current text), the project's stack, the Claude Code version, and today's date. Each returns proposals with sources.

## Step 5: Verify

Collect all proposals and dispatch one `agent-harness:citation-verifier` subagent with the full list. It re-fetches every URL and returns each proposal as VERIFIED, WEAK, or REJECTED.

- Drop REJECTED proposals.
- Keep WEAK ones only in the optional group, labeled "weak evidence".
- A finding from the local checks with no verified source can still be reported if it's a factual defect (a missing file, a broken command). Label its evidence "verified locally" and show the proof (e.g. "`package.json` has no `test:unit` script").

## Step 6: Report

Present one numbered list, grouped by severity: **Critical**, **Recommended**, **Optional**. Number continuously across groups. Each item:

```
N. <Short title>  [<check ID>]  <file:line>
   Problem: <one line>
   Change:  <exact proposed edit, or a small before → after>
   Why:     <one line on the effect>
   Source:  "<verbatim quote>" — <URL> (<official docs | vendor blog | GitHub issue | research paper | community>, checked <date>)
```

Then show the projected result: root file line count before → after if everything is applied.

End with a short note on what this audit adds over the built-in `/doctor prompt-audit` (external, verified sources) and suggest running it too.

## Step 7: Apply the user's picks

Ask the user which items to apply, as free text: numbers like `1,3,5-7`, `all`, `critical`, or `none`. Do not use AskUserQuestion here; the list is usually longer than 4 options.

Apply only the picked items. For edits that move content between files (e.g. CLAUDE.md → AGENTS.md), show the before/after of both files and confirm once more before writing. Never use symlinks. Never touch files outside the agent context files and `.gitignore` / `.gemini/settings.json` without asking.

After applying, re-run the size and loading checks (S1–S4, L1–L8) and report the result. Do not commit; offer to.
