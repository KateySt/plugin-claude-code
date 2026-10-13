# sdd-engineering

Spec-driven development for Claude Code. The spec is the source of truth: requirements become EARS acceptance criteria before any code exists. Tests are derived from those criteria, not from code. An independent verifier checks every criterion at the end.

## Install

```bash
claude plugin marketplace add KateySt/plugin-claude-code
claude plugin install sdd-engineering@kateyst-plugins
```

The plugin depends on [`superpowers`](https://github.com/obra/superpowers) from `claude-plugins-official`, which is installed automatically. Check with `claude plugin list`: both plugins should be enabled with no errors.

## Use

```text
/sdd-engineering:sdd add CSV export to the reports page; respect the current filters
```

The skill first decides whether SDD is worth it:
- spikes and quick fixes → no spec;
- small, clear changes → a short plan, then code;
- otherwise → the full pipeline below.

To continue an unfinished feature, run `/sdd-engineering:sdd specs/003-csv-export`.

## Pipeline

```text
 you ──request──▶ spec-creator ──questions──▶ you ──answers──▶ spec-creator
                                                                    │ spec.md (EARS, AC-1..n)
                                                    you approve ◀───┘
                                                         │
                     researcher ──▶ research.md (facts with path:line)
                                                         │
          implementation-planner ──▶ plan.md (T1 → AC-1 → test name)
                                                         │
                                         you approve ◀───┘
                                                         │
                     test-writer ──▶ failing tests, one or more per AC (reads the spec, never the code)
                                                         │
                     implementer ──▶ code, one task at a time, until tests pass
                                                         │
           architecture-reviewer ──▶ BLOCKING / NOTE findings against docs/ and AGENTS.md
                                                         │
                   plan-verifier ──▶ verification.md (PASS/FAIL per AC, VERDICT)
```

| Agent | Produces | Checked against |
|---|---|---|
| `spec-creator` | `spec.md` | spec review checklist |
| `researcher` | `research.md` | every fact cites a file |
| `implementation-planner` | `plan.md` | every AC has a task, every task an AC |
| `test-writer` | tests | each test names its AC |
| `implementer` | code | the tests pass |
| `architecture-reviewer` | findings | `docs/`, ADRs, `AGENTS.md` |
| `plan-verifier` | `verification.md` | every AC has code, a test, and a passing run |

If any agent finds the spec wrong, the pipeline stops and updates the spec with you. Nobody works around it.

## Files it creates in your project

```text
specs/<NNN>-<slug>/   spec.md, research.md, plan.md, verification.md
docs/                 architecture, ADRs, conventions (read by the reviewer)
insights/INSIGHTS.md  raw notes from agents; you decide what moves to docs/ or AGENTS.md
```

Templates and rules: `references/` (spec template, EARS patterns, review checklist, plan format, folder rules).
