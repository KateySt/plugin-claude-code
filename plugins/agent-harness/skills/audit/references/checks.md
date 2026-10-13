# Local audit checks

Run these against the repository before any web research. Each finding records: check ID, file:line, what's wrong, severity. Severity: **critical** (agent context is broken or wrong), **recommended** (measurable quality or cost gain), **optional** (polish).

## Loading (does the context actually reach each tool?)

| ID | Check | Severity |
|---|---|---|
| L1 | CLAUDE.md, `.claude/CLAUDE.md`, or `CLAUDE.local.md` exists, AGENTS.md exists, and no CLAUDE.md imports `@AGENTS.md` → Claude Code silently ignores AGENTS.md | critical |
| L2 | CLAUDE.md is a symlink, or a one-line text file containing just a path (a symlink checked out without `core.symlinks`) | critical |
| L3 | CLAUDE.md says "read AGENTS.md" in prose instead of `@AGENTS.md` import | recommended |
| L4 | `@AGENTS.md` is not the first line of CLAUDE.md | optional |
| L5 | `@import` points to a file that doesn't exist, or an import chain deeper than 4 | critical |
| L6 | Team uses Gemini CLI but `.gemini/settings.json` doesn't list AGENTS.md in `context.fileName` | recommended |
| L7 | A `SessionStart` hook prints AGENTS.md (now duplicates native loading) | recommended |
| L8 | Subdirectory has both CLAUDE.md and AGENTS.md without the import (Claude skips the AGENTS.md there) | critical |

## Correctness (is the content still true?)

| ID | Check | Severity |
|---|---|---|
| C1 | A documented command references a script/target that doesn't exist (`package.json` scripts, Makefile targets, pyproject scripts, etc.) | critical |
| C2 | A documented path doesn't exist | critical |
| C3 | Documented stack/version contradicts the manifest or lockfile | critical |
| C4 | Two context files contradict each other (AGENTS.md vs CLAUDE.md vs .cursor/rules vs copilot instructions vs nested files) | critical |
| C5 | Same rule duplicated across files (drift risk; tools that concatenate see it twice) | recommended |

## Content quality

| ID | Check | Severity |
|---|---|---|
| Q1 | No build/test/lint commands, or no single-test command | recommended |
| Q2 | No boundaries (Always / Ask first / Never), or no "never commit secrets" | recommended |
| Q3 | Directory tree, file-by-file description, dependency list, or architecture overview | recommended |
| Q4 | Generic advice the model already follows ("write clean code", standard language conventions) | recommended |
| Q5 | Rule a linter/formatter/hook could enforce, stated only as an instruction | optional |
| Q6 | Volatile information (current sprint, team roster, ticket numbers, dates) | recommended |
| Q7 | Multi-step procedure (release, deploy, migration runbook) inline → belongs in a skill or a linked doc | recommended |
| Q8 | Overuse of IMPORTANT / MUST / ALWAYS (more than ~3) | optional |
| Q9 | Commands and boundaries appear late in the file (earlier instructions carry more weight) | optional |

## Size and cost

| ID | Check | Severity |
|---|---|---|
| S1 | Any single CLAUDE.md/AGENTS.md over 200 lines | recommended |
| S2 | Root AGENTS.md over 100 lines (house target) | optional |
| S3 | Root file + all eager `@imports` over 200 lines combined | recommended |
| S4 | Combined AGENTS.md chain over 32 KiB (Codex truncates) | critical |
| S5 | Area-specific rules in the root file that could be a nested AGENTS.md, `.claude/rules` with `paths:`, or a plain-path link | optional |

## Harness (beyond the context file, only report if relevant)

| ID | Check | Severity |
|---|---|---|
| H1 | `.env*` or secrets files not in `.gitignore` | critical |
| H2 | `CLAUDE.local.md` exists but isn't gitignored | recommended |
| H3 | Project skills/agents with missing or vague `description` (won't trigger) | recommended |
