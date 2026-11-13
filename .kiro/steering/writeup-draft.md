---
inclusion: manual
---

# /writeup-draft: turn the build record into the Kiro write-up

Draft `docs/submission/writeup.md` using `docs/submission/writeup-template.md` as the structure.

## Sources you may use (and nothing else)

- `docs/kiro-journal.md` (what was done, when, with which Kiro feature)
- `docs/tuning-log.md` and `docs/field-tests.md`
- `.kiro/specs/*/requirements.md`, `design.md`, `tasks.md`
- `.kiro/steering/`, `.kiro/hooks/`, `.kiro/agents/`, `.kiro/settings/mcp.json`
- `git log --stat` (run it; summarise, do not paste)
- What the user tells you in this conversation

## Rules

1. **Only write what the sources support.** If the template asks for something the record does not show (for example "how Kiro Web was used" and there is no trace of it), write a clearly marked placeholder such as `[[USER: did you use Kiro Web? If yes, for what?]]` and move on. Never invent an anecdote, a number or a quote.
2. Use real numbers from the record: how many specs, requirements, properties and tasks; chamber results before and after tuning; field-test outcomes.
3. Include at least one concrete property-test story if the record has one: the property, the shrunk counterexample, the bug, the fix.
4. Keep it specific to this project. No general praise of tools.
5. State plainly what was prepared outside Kiro (planning briefs, starter steering and hook files) and what was built inside it.
6. Plain language, short paragraphs, sentence-case headings. Under 900 words unless the user asks for more.

## Output

Write the file, then list every `[[USER: ...]]` placeholder you left so the user can fill them in.
