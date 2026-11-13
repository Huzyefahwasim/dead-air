---
inclusion: always
---

# Working agreement for the agent

## Before you write code

- If the work belongs to a spec, read that spec's `requirements.md`, `design.md` and the task you are on. If a brief exists in `docs/briefs/`, it outranks your assumptions.
- Do exactly the task asked. No drive-by refactors, no renames, no reformatting of untouched files, no new features.
- If something is ambiguous and the answer would change a byte layout, a public function signature or a user-visible promise, stop and ask one precise question. Otherwise choose the simplest option and note it in your summary.

## While you work

- Keep changes small. One task, one concern, ideally under 200 changed lines.
- Every behaviour change comes with a test in the same task. Libraries (`modem`, `protocol`) need a property test for anything that has a "for any input" statement in the spec.
- Run `npm run typecheck` and `npm test` before you say a task is done. Paste the summary line, not the whole log.
- Constants come from `profiles.ts` (modem) or `layout.ts` (protocol). Never retype a number.

## When a test fails

- A failing property test is information. Report the shrunk counterexample first.
- Fix the implementation. If you believe the property or requirement is wrong, say so and stop; do not edit a test, a threshold in `chamber/thresholds.json`, a preset, or a spec requirement to make a failure disappear.
- Never delete, skip or weaken a test without the user's explicit agreement in this conversation.

## Frozen things (need the user's explicit instruction to change)

- The on-air format: tone plan, symbol timing, preamble patterns, byte-to-tone mapping, FEC, whitening.
- The packet header, object and manifest layouts, and the signing rules.
- `LICENSE`, `.kiro/steering/product.md`, `chamber/thresholds.json`.
- Never add `.kiro` (or anything under it) to `.gitignore`. Never commit secrets or private keys.

## Being economical

Credits are limited. Read only the files you need. Do not re-read a file you have just written. Do not paste long outputs back into the chat. Prefer one focused command over several exploratory ones. If a task is turning out much larger than described, stop and propose a split.

## Definition of done for a task

1. Code and tests for the task are written.
2. `npm run typecheck` and `npm test` pass.
3. If `packages/modem`, `packages/protocol` or `packages/chamber` changed and the chamber exists, `npm run chamber:quick` passes.
4. Public behaviour is documented in the package README or TSDoc when it changed.
5. Your final message says, in five lines or fewer: what changed, which requirements or properties it covers, test result, anything you decided on your own, anything the user should check by hand.

## Commit messages

`<area>: <what changed>` in the imperative, for example `modem: add preamble detector`. Reference the spec task number in the body when there is one.
