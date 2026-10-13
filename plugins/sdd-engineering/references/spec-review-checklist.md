# Spec review checklist

Run before a spec goes to the human for approval. Every item must be **yes**. A **no** is fixed in the spec, or turned into a `[NEEDS CLARIFICATION: …]` question for the user.

1. **Atomic:** each AC states one reaction to one trigger or state.
2. **Testable:** each AC's trigger, state, and reaction are observable, so a test can pass or fail it without interpretation.
3. **Consistent:** no two ACs contradict each other, and no AC contradicts a non-goal.
4. **Behavior, not implementation:** ACs say what the system does, not which library, data structure, or file does it.
5. **Boundaries explicit:** Goals and Non-goals are both filled in; every edge case is covered by an AC or a clarification question.
6. **No open questions:** no `[NEEDS CLARIFICATION` markers remain.

Size rule: 1–3 pages. Longer → propose splitting into two features, each with its own spec.

Also check:
- Every AC has an ID (`AC-1`, `AC-2`, …), numbered without gaps.
- `Inputs (provenance)` and `Untrusted inputs` are filled in (write "None" if there are none).
- The Changelog has a row for this revision.
