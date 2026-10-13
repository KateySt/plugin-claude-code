# EARS — writing acceptance criteria

EARS (Easy Approach to Requirements Syntax, Alistair Mavin, Rolls-Royce, 2009) turns each requirement into one testable sentence with a visible trigger, state, and reaction. Every acceptance criterion uses exactly one pattern and the keyword **shall**. Use `shall` in every spec; mixing in "should", "must", or "will" makes testability drift.

| Pattern | Template | Example |
|---|---|---|
| Ubiquitous | The <system> shall <response>. | The system shall log every authentication attempt. |
| Event-driven | WHEN <trigger>, the <system> shall <response>. | WHEN the user submits the login form, the system shall validate the credentials. |
| State-driven | WHILE <state>, the <system> shall <response>. | WHILE sync is in progress, the system shall show a progress indicator. |
| Unwanted behavior | IF <unwanted condition>, THEN the <system> shall <response>. | IF validation fails three times within 60 s, THEN the system shall lock the account for 15 min. |
| Optional feature | WHERE <feature is enabled>, the <system> shall <response>. | WHERE MFA is enabled, the system shall require a TOTP code. |

Patterns can combine (`WHILE <state>, WHEN <trigger>, the system shall …`) but keep one reaction per criterion. Two reactions → two ACs.

## Rewriting vague requirements

| Vague | EARS |
|---|---|
| "Should work fine on large repos." | WHEN the repository exceeds the indexing threshold, the system shall build the overview from deterministic facts only, without reading full file contents. |
| "Shouldn't crash if the model is unavailable." | IF the model call fails, THEN the system shall show a deterministic fallback result and the failure reason. |
| "Should suggest where to start reading." | The system shall order the reading path by file rank from the import graph, not alphabetically. |

## Checks for each AC

- One pattern, one `shall`, one reaction.
- The trigger or state is observable from outside the code.
- A test can tell pass from fail without interpretation.
- It describes behavior, not how it's built ("shall return …", not "shall use a hash map").
- Numbers are concrete (`60 s`, `3 attempts`), not "fast" or "a few".
