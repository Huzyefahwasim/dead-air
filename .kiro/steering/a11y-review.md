---
inclusion: manual
---

# /a11y-review: accessibility audit of the web app

Audit `apps/web` against the checklist below. This is a review: **do not change code** unless the user then asks you to fix specific findings.

## How to review

Read the screens and components (`apps/web/src/screens`, `apps/web/src/components`, `apps/web/src/styles`). For each checklist item answer Pass, Fail or Cannot tell from code, and point to the file and line for every Fail.

## Checklist

**Perceivable**
1. Text on black uses only white, yellow, cyan or green. Red, blue and magenta appear only as backgrounds with white or yellow text.
2. No information is carried by colour alone. Trust states show an icon and a word as well as a colour.
3. Text is real text (not canvas or images) and scales to 200 percent without clipping. The 40-column grid still fits a 320 px viewport.
4. The Waterfall and SignalMeter have a text equivalent (for example "Signal: strong, 3 of 5 pages received").
5. Decorative effects (glow, scanlines, static) are hidden from assistive technology and switched off under `prefers-reduced-motion: reduce`. Nothing flashes more than 3 times per second.

**Operable**
6. Every action is reachable and usable with the keyboard alone, in a logical order. Digits open the page keypad. Escape closes overlays.
7. Focus is always visible (2 px cyan outline) and is never trapped.
8. Touch targets are at least 44 x 44 CSS pixels with space between them.
9. Read aloud can be stopped with one press, and starting a new page stops the previous speech.

**Understandable**
10. Every control has an accessible name that matches its visible label. The Fastext keys have text labels, not just colours.
11. Page content carries the right `lang`, and right-to-left pages carry `dir="rtl"`.
12. Errors say what happened and what to do next (microphone blocked, unsupported browser, storage full).
13. Copy is plain and short. No internal jargon ("preamble", "frame", "ESI") on the Receiver.

**Robust and specific to this app**
14. A live region announces: listening started or stopped, each new page, and each change of trust state. Urgent verified pages use `assertive`, everything else `polite`.
15. A new verified page triggers a vibration (where supported) and a visible banner, so a deaf user notices it without sound.
16. An unverified page can never be mistaken for a verified one, including by a screen-reader user: the trust state is read before the page title.
17. The Listen screen states that audio is processed on the device and not stored or sent.

## Output

A table of the 17 items with status and evidence, then a list of fixes ordered by impact on a real user, each small enough to be one task. End with what can only be checked by hand on a device (screen reader pass, real vibration, real speech).
