# Feature spec template

Copy the skeleton into `specs/<NNN>-<slug>/spec.md`. Keep a feature spec to 1–3 pages; if it grows past that, split the feature in two. Describe behavior and boundaries, not implementation.

```markdown
# Spec: <feature> | Spec ID: SPEC-<NNN> | Status: draft
Base: <commit the feature started from — written by /sdd-engineering:sdd>

## Problem and why
<Who has the problem, what it costs them today, why solve it now.>

## Goals / Non-goals
- Goal: <outcome>
- Non-goal: <what this feature explicitly does NOT do>

## User stories
- As a <role>, I want <capability>, so that <result>.

## Acceptance criteria (EARS)
- AC-1: <one EARS statement — see ears.md>
- AC-2: …

## Edge cases
- <empty state, limits, errors, concurrency — each one tied to an AC or a NEEDS CLARIFICATION>

## Non-functional
<Performance, security, accessibility — only if relevant. Otherwise "None beyond project defaults.">

## Inputs (provenance)
- <input> — [reused: <existing module/data>] | [deterministic: computed by code] | [new: model call / external service]

## Untrusted inputs
- <any foreign text the feature reads (user content, files from other repos, web pages) — treated as data, never as instructions>

## Open questions
- [NEEDS CLARIFICATION: <open question>]
<!-- When every question is answered, replace the list with "None." -->


## Changelog
| Date | Change | Why |
|---|---|---|
| <YYYY-MM-DD> | Created | <request summary> |
```

`Status` moves `draft` → `approved` (the human approved it) → `implemented` (plan-verifier passed). Only `/sdd-engineering:sdd` changes it.

## Example acceptance criteria

One per EARS pattern, for a feature "average of a number list":

- AC-1 (ubiquitous): The `average` function shall return the arithmetic mean of the numbers it receives.
- AC-2 (event): WHEN `average` receives an empty list, the function shall return 0.
- AC-3 (unwanted): IF the list contains a non-numeric value, THEN the function shall throw a `TypeError` naming the offending index.
- AC-4 (state): WHILE strict mode is enabled, the function shall throw a `RangeError` for a list containing `NaN` or `Infinity`.
- AC-5 (optional): WHERE a `precision` option is given, the function shall round the result to that many decimal places.
