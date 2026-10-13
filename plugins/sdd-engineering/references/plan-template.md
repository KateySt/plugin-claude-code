# Plan template

Write the plan to `specs/<NNN>-<slug>/plan.md`. The plan links every task to the acceptance criteria it satisfies and to the test that proves it. `plan-verifier` walks these lines, so keep the format exact.

```markdown
# Plan: <feature> | Spec: SPEC-<NNN>
Approved:

## Approach
<3–6 lines: the shape of the change, key files, anything from research.md that constrains it.>

## Tasks
- [ ] T1 <task> → AC-1 → <test name>
- [ ] [P] T2 <task> → AC-2, AC-3 → <test name>
- [ ] T3 <task> → AC-4 → <test name>

## Coverage
| AC | Tasks | Tests |
|---|---|---|
| AC-1 | T1 | <test name> |
```

Line format: `- [ ] [P] T<n> <task> → AC-<n>[, AC-<m>] → <test name>`

- `T<n>`: task ID, numbered in execution order.
- `[P]`: optional; the task touches no files that another `[P]` task touches, so it can run in parallel.
- `→ AC-…`: every task names at least one AC; every AC appears in at least one task.
- `→ <test name>`: the test that proves the task; test-writer uses this name.
- The checkbox is ticked by `implementer` when the task's tests pass.
- `T0`: only when the project has no test framework. It sets one up (`- [ ] T0 Set up <framework>`), runs before any tests are written, and is the only task without an AC and a test name.
- ACs struck through in the spec (`~~AC-n~~`) need no task.

`Approved:` stays empty until the human approves the plan; `/sdd-engineering:sdd` then writes `Approved: <YYYY-MM-DD>`.

## Example

```markdown
- [ ] T1 Add `average(numbers)` returning the mean → AC-1 → test_average_returns_mean
- [ ] T2 Return 0 for an empty list → AC-2 → test_average_empty_list_returns_zero
- [ ] [P] T3 Reject non-numeric items with TypeError naming the index → AC-3 → test_average_rejects_non_numeric
```
