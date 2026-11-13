# Brief 05: Station console

- **Spec name:** `station-console`
- **Package:** `apps/web` (`@deadair/web`), route `#/station`
- **Depends on:** `@deadair/modem`, `@deadair/protocol`, components from the Receiver
- **Milestone:** M6

## 1. Purpose

The Station is where an operator turns a handful of facts into a signed issue and puts it on air. The operator may be a volunteer at a community radio desk with ten minutes and a lot on their mind. The console's job is to keep them inside the byte budget, make signing invisible, and make "is it on air right now?" impossible to misread.

## 2. The operator's path

1. **Identity (once):** name the station, create its key. See the trust link and QR code to hand to listeners.
2. **Compose:** start from a sample or a template, edit pages. A meter shows characters, bytes, parts and seconds of airtime as they type.
3. **Check:** preview each page exactly as a receiver will show it.
4. **Publish:** choose how long the issue stays valid and which profile to use. The issue is signed.
5. **Broadcast:** press ON AIR to loop it through the speakers or the line out, or export a WAV file to schedule like any other audio item.

## 3. Screen layout

One screen, three columns on desktop, stacked on a phone:

- **Pages** (left): list of pages with number, title, priority, parts; add, duplicate, reorder, delete; issue totals.
- **Editor** (middle): number, language, title, body, priority, right-to-left switch; live preview in a TeletextScreen; BudgetMeter.
- **Air** (right): station identity, validity, profile, ON AIR lamp and button, loop timer, export.

## 4. Requirements

**R1 Station identity**
1. WHEN no station key exists, THE console SHALL ask for a station name (1 to 24 bytes of UTF-8) and create a key pair from 32 bytes of `crypto.getRandomValues`.
2. THE private key SHALL be stored only in IndexedDB on this device and SHALL never be logged, displayed, or sent anywhere.
3. THE console SHALL show the station's trust link as text with a copy button and as a QR code.
4. THE operator SHALL be able to export a key backup file (`<station>.deadair-key.json`, a name pattern that `.gitignore` already excludes) and import one, each behind a warning that anyone holding the file can sign as the station.
5. THE console SHALL state that browser key storage is suitable for demonstrations and small community use, not for high-risk settings.

**R2 Composing**
1. THE operator SHALL be able to create up to 12 pages, each with number (100 to 899, unique per language), language, title, body, priority and direction.
2. WHILE the operator types, THE BudgetMeter SHALL show for the page: characters of 640, lines of 15, payload bytes, parts of 6, and seconds of airtime for the selected profile; and for the issue: pages of 12, parts of 40, seconds per loop. Values come from `measureIssue`.
3. THE body editor SHALL show a 40-column guide and soft-wrap long lines into 40-column lines on request, never silently.
4. IF a page or the issue is over a limit, THEN THE console SHALL mark the exact field, say by how much, and disable publishing.
5. THE console SHALL generate page 100 as an index of the other pages (number and title per line) unless the operator writes their own.
6. THE preview SHALL render the page with the same component the Receiver uses.

**R3 Starting points**
1. THE console SHALL offer the sample issues in `content/` and at least four templates: weather warning, shelter list, water and food points, clinic hours.
2. Samples and templates SHALL use fictional places and organisations only.
3. THE operator SHALL be able to save the current pages to a JSON file (`<name>.deadair-issue.json`) and load such a file. The file holds pages only, never keys or signatures.
4. Pages marked `"draft": true` in a loaded file SHALL be treated exactly like imported drafts (R4.4): shown as DRAFT with their source, and not publishable until confirmed one by one.

**R4 Importing public alerts (best effort, optional for the operator)**
1. THE operator SHALL be able to import active alerts for a US state from the National Weather Service API (`https://api.weather.gov/alerts/active?area=<two-letter state>`), fetched from the browser with default headers.
2. IF the fetch fails for any reason, THEN THE console SHALL say so and offer the bundled sample response and a box to paste alert JSON by hand.
3. Each alert SHALL be mapped to a draft page: event name as title; then area, severity, expiry time and the instruction text, cut to the page limits with a visible "[cut]" marker where text was dropped; priority from the alert's severity.
4. Imported drafts SHALL be clearly marked DRAFT, SHALL credit the source on the page ("Source: NWS"), and SHALL NOT be publishable until the operator has opened and confirmed each one.
5. THE import SHALL be the only place the Station touches the network.

**R5 Publishing**
1. WHEN the operator publishes, THE console SHALL build the issue with a random `issueId`, the current time, the chosen validity (30 minutes, 2 hours, 12 hours, 24 hours or 3 days) and sign it.
2. THE console SHALL then verify its own issue with the station's public key and show "Signed and checked" before allowing broadcast.
3. Editing any page after publishing SHALL mark the issue as changed and require publishing again.

**R6 Broadcasting**
1. THE operator SHALL choose a profile, with `ROOM-1` as the default, described in plain words: "Room: slower, works across a room" and "Close-up: twice as fast, phone must be near the speaker".
2. WHEN ON AIR is pressed, THE console SHALL play the carousel continuously through the audio output, starting with 300 ms of silence, until STOP is pressed.
3. THE ON AIR lamp SHALL be lit exactly while audio is being output, and the console SHALL show elapsed time, the loop number, and the page being sent.
4. WHILE on air, THE console SHALL hold a screen wake lock where supported and SHALL warn before the tab is closed.
5. THE console SHALL advise setting the output volume to about 70 percent and say that the sound is loud and harsh by design.

**R7 Export**
1. THE operator SHALL be able to export 1 to 5 loops of the carousel as a 48 kHz, 16-bit mono WAV file named with the station, date and profile.
2. THE export SHALL show the file's duration before saving.
3. Under a collapsed "Testing" section, THE console SHALL offer "Export a tampered copy": the same audio with one page's payload altered after signing. The file name SHALL contain `TAMPERED`.

**R8 Monitoring**
1. THE console SHALL offer "Check my own signal", which decodes the generated audio in memory and confirms every page arrives VERIFIED, without using the microphone.

**R9 Safety of content**
1. THE console SHALL never publish without an explicit press of Publish, and SHALL never broadcast an issue containing unconfirmed drafts.
2. THE console SHALL remind the operator that receivers will show the station name and signing time on every page.

**R10 Accessibility and layout**
1. All rules in `ui-teletext.md` apply. The console SHALL be fully usable by keyboard and at 320 px width.

## 5. Correctness properties

| Id | Property | Validates |
|---|---|---|
| P1 | **Meter equals library.** For any set of pages, every number the BudgetMeter view model shows equals `measureIssue` for the same pages. | R2.2 |
| P2 | **Publish gate.** For any editor state, publishing is enabled exactly when every page is valid, the issue is within budget, and no page is an unconfirmed draft. | R2.4, R4.4, R9.1 |
| P3 | **Index page.** For any set of pages without a page 100, the generated index lists every other page exactly once, in page order, and is itself within the page limits (splitting titles with an ellipsis if needed). | R2.5 |
| P4 | **Alert mapping is safe.** For any JSON value, including arbitrary strings of any length and missing fields, mapping it to draft pages never throws, and every draft produced satisfies the page limits. | R4.3 |
| P5 | **Export round trip.** For any small valid issue and either profile, decoding the exported WAV bytes through the WAV reader, the modem receiver and the assembler yields every page VERIFIED under the station's key. | R7.1, R8.1 |
| P6 | **Tampered export is caught.** For any small valid issue, decoding the tampered export yields no VERIFIED copy of the altered page. | R7.3 |
| P7 | **Key backup round trip.** For any station key and name, export followed by import gives the same key, name and trust link. | R1.4 |
| P8 | **Changed means unpublished.** For any sequence of edits and publishes, broadcast is enabled exactly when the pages equal those of the last published issue. | R5.3 |
| P9 | **Soft wrap.** For any text, soft-wrapping produces lines of at most 40 characters and joining them with spaces reproduces the original words in order. | R2.3 |

## 6. Not in this spec (documented extension point only)

**Automatic condensing and translation with a language model.** The core product must cost nothing to run and work with no network, so no model API is called anywhere. Define a `Condenser` interface (`condense(text, limits) -> Promise<DraftPage>`) with a default implementation that only cuts and marks, and note in the README that a hosted or on-device model can be plugged in behind it. The Crew companion app (Brief 07) is where model-drafted pages come from, and they still pass through R4.4 and R9.1.

## 7. Dependencies allowed for this spec

A small MIT-licensed QR code generator (for example `qrcode-generator`). Nothing else new.

## 8. Suggested order of work

1. Editor state reducer with properties P1, P2, P3, P8, P9; no UI.
2. Pages list, editor, preview and BudgetMeter.
3. Station identity, trust link, QR, backup (P7).
4. Publish and self-check.
5. Broadcast with the ON AIR lamp.
6. WAV export and the tampered copy (P5, P6).
7. Samples and templates (ask the `field-editor` agent for the content).
8. Alert import (P4).
