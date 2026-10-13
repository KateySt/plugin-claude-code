---
name: learnings
description: Capture non-obvious lessons from the current session into LEARNINGS.md (dead ends, gotchas, recurring errors and their fixes), and periodically promote repeated ones into AGENTS.md, path-scoped .claude/rules, skills, or hooks. Use when the user asks to wrap up a session, record or save learnings or lessons, "remember this mistake", or review, clean up, or promote LEARNINGS.md.
argument-hint: "[wrap-up | review] [path to project root, default: current directory]"
---

# Learnings: capture, then promote

LEARNINGS.md is an inbox, not the final destination. You capture lessons from the session (`wrap-up`), and later move the ones that repeat to a place where they are reliably applied (`review`). You write nothing before the user approves.

Mode: the first word of `$ARGUMENTS` if it is `wrap-up` or `review`, otherwise `wrap-up`. Target project: the remaining argument if given, otherwise the current working directory.

Entry format and sections: `${CLAUDE_PLUGIN_ROOT}/skills/learnings/references/learnings-template.md`.

## Step 0: File and pointer (both modes)

1. Look for `LEARNINGS.md` at the project root. If it is missing, show the template and offer to create it.
2. Check that the root AGENTS.md (or CLAUDE.md if there is no AGENTS.md) points to it. If not, propose this one line for its map section:
   `` - `LEARNINGS.md` — lessons from past sessions; before working in an area, read the entries whose scope matches. ``
3. Never add `@LEARNINGS.md` as an import. Imported files load in full at launch and count against the context budget [S1]. The file grows; a pointer costs one line.

## Mode: wrap-up

### 1. Collect candidates from this conversation

Look for:
- an approach that failed before another one worked, and why it failed;
- a correction from the user about the code or the tools (not about their personal preferences);
- the same error seen twice, and the fix;
- library, tool, or codebase behavior that surprised you;
- a decision with a reason that is not visible in the code;
- something left unresolved.

### 2. Filter

Drop a candidate if any of these hold, and note the reason:
- **Obvious:** someone reading the code would know it anyway.
- **Not actionable cold:** an agent reading it next month without this conversation would not know exactly what to do. "Be careful with async" fails; "`Promise.all()` in `src/ingest/` times out above ~30 items, use `Promise.allSettled()` in batches of 10" passes.
- **Derivable:** it follows from the code, config, or git history.
- **Already covered:** it is already in AGENTS.md, CLAUDE.md, `.claude/rules/`, a skill, or auto memory.
- **Belongs in auto memory:** it is about the user (role, preferences, how they like to work), not about the project. Auto memory already stores these [S2].

Keep at most 5 entries per session. Prefer "What Doesn't Work" and "Recurring Errors → Fix" over everything else.

### 3. Merge with what is there

Read LEARNINGS.md. For each candidate:
- An existing entry says the same thing → increase its `×count`, update the date, and sharpen the wording if the new case adds detail. Do not add a duplicate.
- An existing entry contradicts it → show both and ask which is true. Contradictions make the agent pick one arbitrarily [S3].
- Otherwise → new entry in the matching section, `×1`, today's date, the narrowest correct `scope`.

### 4. Show, then write

Show one diff of LEARNINGS.md: new entries, updated entries, and the dropped candidates with the reason in one line each. Write after the user approves, applying any edits they ask for.

If any entry now has `×2` or more, say so and suggest `/agent-harness:learnings review`.

## Mode: review

### 1. Read

Read LEARNINGS.md, AGENTS.md, CLAUDE.md, `.claude/rules/**`, `.claude/skills/**/SKILL.md`, and the `hooks` block of `.claude/settings.json`.

### 2. Classify every entry

| Verdict | When | Proposed change |
|---|---|---|
| Promote → AGENTS.md | `×2`+, applies to every session, fits in one line | Add the line; remove the entry |
| Promote → rule | `×2`+, applies to one part of the code | Add to `.claude/rules/<topic>.md` with `paths:` set from the entry's scope [S4]; remove the entry |
| Promote → skill | A multi-step procedure | Draft `.claude/skills/<name>/SKILL.md`; remove the entry |
| Promote → hook | Breaking it is never acceptable | Draft a `PreToolUse` hook; context is not enforced, hooks are [S2] |
| Stale | The file, API, or version it names no longer exists | Delete. Check with Glob/Grep and the manifests before you call it stale |
| Conflict | Contradicts another entry or a rule | Ask which is true |
| Keep | `×1`, still valid | Nothing |

An entry the user calls a firm rule can be promoted at `×1`.

### 3. Report and apply

Present a numbered list. For each item: the entry, the verdict, the exact edit (target file and text), and one line of why. Ask which to apply as free text: numbers like `1,3,5-7`, `all`, or `none`.

Apply only the picked items. Show a hook's script and `settings.json` change and confirm once more before writing them. When you promote an entry, remove it from LEARNINGS.md; wrap-up checks the targets for duplicates, so it will not be captured again.

Finish with: number of entries before → after, and the root AGENTS.md/CLAUDE.md line count. If that file is over 200 lines, say so and suggest moving lines into path-scoped rules [S1]. Do not commit; offer to.

## Sources

- [S1] "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence… Imports help you organize a long file but don't reduce its context cost, because imported files also load at launch." — https://code.claude.com/docs/en/memory
- [S2] Auto memory saves `user`, `feedback`, `project`, `reference` notes; "Claude skips anything it can derive from the codebase, such as architecture, file paths, or debugging fixes." Also: "Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead." — https://code.claude.com/docs/en/memory
- [S3] "if two instructions contradict each other, Claude may pick one arbitrarily." — https://code.claude.com/docs/en/memory
- [S4] "Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns." — https://code.claude.com/docs/en/memory
- Section layout and the "specific enough that an agent reading it cold knows exactly what to do or avoid" test — https://www.mindstudio.ai/blog/self-learning-ai-skill-system-learnings-md-wrap-up
