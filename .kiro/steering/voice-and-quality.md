---
inclusion: fileMatch
fileMatchPattern: ["apps/web/**", "content/**", "README.md", "docs/submission/**"]
---

# Voice and quality: the shared standards

Whenever you touch the interface, its text, sample content or a public document, the two documents below are part of your instructions. Everything written about the project follows the same two documents, so the product and its documents sound like one person.

#[[file:docs/standards/voice.md]]

#[[file:docs/standards/quality-bar.md]]

## What this means when you build the interface

- Every string a user can see lives in `apps/web/src/content/strings.ts` and follows the voice rules: plain words, no dashes, no hype, no jargon on the Receiver.
- Before you call a screen done, go through "Easy to use" and "Clearly made on purpose" in the quality bar and fix what fails. Say in your summary which items you checked.
- Design every state of a screen in the same task as the screen itself: empty, working, done, failed. A screen with only the happy path is not finished.
- Never add anything from the "none of these, ever" list, even as a placeholder.
- Sample pages and templates are written by the `field-editor` agent, not improvised inside a component.
