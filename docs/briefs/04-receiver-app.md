# Brief 04: Receiver app

- **Spec name:** `receiver-app`
- **Package:** `apps/web` (`@deadair/web`), routes `#/`, `#/listen`, `#/about`
- **Depends on:** `@deadair/modem`, `@deadair/protocol`
- **Milestone:** M5

## 1. Purpose

The Receiver is what a person with no connectivity holds up to a radio. It must work offline, make it obvious whether the phone is hearing anything, show pages the moment they are complete, and never let an unverified page pass as a verified one.

## 2. Users and their first minute

1. **Opens the app** (already loaded once before, now offline). Sees a black teletext screen: "DEAD AIR. No signal. Press LISTEN and hold your phone near the speaker."
2. **Presses LISTEN** (red key). Grants the microphone. The waterfall starts moving.
3. **Holds the phone near the broadcast.** Status changes to "Hearing a broadcast", then "Receiving page 101: 2 of 3 parts".
4. **Feels a vibration and sees a banner:** "New page from Riverside Community Radio (VERIFIED)". Reads it. Presses yellow to have it read aloud.
5. **Presses blue, "Pass it on",** and plays the issue to a neighbour's phone.

## 3. Screens

| Route | Content |
|---|---|
| `#/` | Two large choices, LISTEN and STATION, a one-sentence explanation, a link to About |
| `#/listen` | TeletextScreen, status line, SignalMeter and Waterfall (collapsible), FastextKeys, page keypad, trust badge, issue header (station, issued time, expiry) |
| `#/listen/stations` | Trusted stations: list, add by pasting a trust link or scanning a QR code, remove |
| `#/listen/history` | Stored issues, newest first, with station, time, trust state; open or delete |
| `#/about` | What it is, how it works in five sentences, the limits, privacy statement, licenses |

Follow `.kiro/steering/ui-teletext.md` for every visual and accessibility decision.

## 4. Architecture

```
microphone -> AudioWorklet (copies Float32 blocks out, nothing else)
           -> Worker: modem receiver -> protocol assembler -> events
           -> main thread: reducer -> view model -> React
                                   -> IndexedDB (issues, trust store)
```

- All decoding runs in **one Web Worker**. The main thread only renders.
- The view model is produced by a **pure reducer** over worker events. All display rules (which badge, which status text, when to alert) live in that reducer and are tested without a browser.
- The same pipeline has three inputs: microphone, an audio file, and the in-memory simulator. Only the first stage differs.

## 5. Requirements

**R1 Shell and offline**
1. THE app SHALL be a PWA whose service worker precaches every file the Receiver needs, so that `#/listen` loads and works with the device offline after one online visit.
2. THE Receiver routes SHALL make no network request after the app shell has loaded.
3. WHEN a new version has been downloaded, THE app SHALL show "Update ready" and apply it only when the user is not listening.

**R2 Listening**
1. WHEN the user presses LISTEN, THE app SHALL request the microphone with echo cancellation, noise suppression and automatic gain control all turned off, mono.
2. THE app SHALL create the audio context at the device's native sample rate and pass that rate to the decoder.
3. WHILE listening, THE app SHALL request a screen wake lock where the browser supports it, and release it when listening stops.
4. IF the microphone is refused or unavailable, or `AudioWorklet` is unsupported, THEN THE app SHALL explain what happened and what to do, and SHALL offer "Decode from a file" and "Simulate a broadcast" instead.
5. WHEN the user presses STOP, or leaves the route, THE app SHALL stop the microphone and release it.
6. WHILE listening, THE app SHALL state on screen that audio is processed on the device and is not stored or sent.

**R3 Signal feedback**
1. WHILE listening, THE app SHALL update the SignalMeter and Waterfall at least 5 times per second from the decoder's level events, starting before any frame decodes.
2. THE status line SHALL show exactly one of: "No signal", "Hearing a broadcast" (preamble seen in the last 5 s), "Receiving page N: a of b parts", "Issue complete: n pages", in plain words.
3. THE app SHALL show counts of good and bad frames in the collapsible signal panel, not in the main view.

**R4 Pages**
1. WHEN the assembler emits a page, THE app SHALL add it to the current issue and make it selectable immediately, without waiting for the rest of the issue.
2. THE user SHALL be able to go to a page by typing its three-digit number, by next and previous, and from the index.
3. IF the issue contains no page 100, THEN THE app SHALL show a generated index of the pages received so far as page 100.
4. Pages SHALL be shown in the user's preferred language when the issue has that page number in it, otherwise in the first available language, with a way to switch.
5. Right-to-left pages SHALL render right-to-left with the correct `lang`.

**R5 Trust display**
1. Every page view SHALL show a TrustBadge with icon, word and colour: VERIFIED with the station's name, UNVERIFIED with the reason in plain words, or REJECTED.
2. THE trust state SHALL appear before the page title in reading order and in the accessibility tree.
3. A REJECTED page SHALL show a warning and no content.
4. THE issue header SHALL always show the station name (or "Unknown station" and its key id), the time the issue was signed, and "EXPIRED" once `issuedAt + ttlMinutes` has passed.
5. WHEN pages come from an unknown station, THE app SHALL NOT offer to trust it from the broadcast. It SHALL explain that a station is added only through its trust link, obtained from the station directly.

**R6 Trusted stations**
1. THE user SHALL be able to add a station by pasting a trust link, and by scanning a QR code where the browser supports `BarcodeDetector`.
2. Before adding, THE app SHALL show the station name and key id and ask for confirmation.
3. THE app SHALL ship with one built-in entry, clearly labelled "Demo station (public demo key)", which can be removed.
4. WHEN a station is added or removed, THE app SHALL re-evaluate the trust state of stored issues from that station.

**R7 Storage**
1. Complete issues, and incomplete ones on stop, SHALL be saved to IndexedDB with their pages, trust states and exact object bytes.
2. THE app SHALL keep at most 20 issues, removing the oldest first, and SHALL survive a full storage quota without losing the current session.
3. THE user SHALL be able to delete one issue or all of them.

**R8 Alerts for people who cannot hear the broadcast**
1. WHEN a page becomes VERIFIED for the first time, THE app SHALL show a full-width banner naming the station and the page title, announce it in a live region, and vibrate (200 ms) where supported.
2. WHEN that page has priority urgent, THE banner SHALL stay until dismissed, the announcement SHALL be assertive, and the vibration pattern SHALL be three long pulses.
3. Unverified pages SHALL NOT trigger vibration or the banner. They appear quietly with their badge.

**R9 Read aloud**
1. WHEN the user presses the yellow key, THE app SHALL speak the trust state, then the title, then the body, using `speechSynthesis` with the page's language, and SHALL stop on a second press or when the page changes.
2. IF no voice exists for the language, THEN THE app SHALL say so in text and not speak in a wrong-language voice silently.

**R10 Pass it on (relay)**
1. WHEN the user presses the blue key on a complete issue, THE app SHALL offer the two profiles with one line each on when to use them, then play the issue's carousel from the stored object bytes for 2 loops, showing an on-air indicator and a STOP control.
2. THE relay SHALL NOT be offered for an issue with any REJECTED page.
3. THE app SHALL stop listening while relaying and resume afterwards if it was listening.

**R11 Other inputs**
1. "Decode from a file" SHALL accept an audio file, decode it with `decodeAudioData`, and run it through the same pipeline faster than real time.
2. "Simulate a broadcast" SHALL generate the bundled sample issue with the demo station key and feed it to the pipeline without using the microphone or speaker, labelled SIMULATION throughout.

**R12 About**
1. THE About page SHALL state the limits listed in `product.md`, the privacy statement, and the licenses of the fonts and libraries used.

**R13 Responsiveness**
1. Decoding SHALL never block the main thread for more than 50 ms.
2. THE layout SHALL work from 320 px width upward, in portrait and landscape.

## 6. Correctness properties

These test the reducer and the non-visual logic, with no browser.

| Id | Property | Validates |
|---|---|---|
| P1 | **Badge follows the library.** For any sequence of assembler events, each page's badge in the view model equals the last trust state emitted for that page. | R5.1 |
| P2 | **No silent upgrade.** For any event sequence, a page whose latest trust state is not `verified` is never marked verified, never triggers the banner or vibration, and a `rejected` page never exposes content. | R5.3, R8.3 |
| P3 | **Alert once.** For any event sequence, the verified-page alert fires exactly once per page per issue, however many duplicate events arrive. | R8.1 |
| P4 | **Status line is a function of state.** For any event sequence and clock value, the status line is exactly one of the four allowed texts and matches the definition in R3.2. | R3.2 |
| P5 | **Keypad.** For any sequence of key presses, the selected page is what R4.2 defines (three digits select a page if it exists, otherwise selection is unchanged and a "not received" note is shown). | R4.2 |
| P6 | **Expiry boundary.** For any `issuedAt`, `ttlMinutes` and `now`, the issue is expired exactly when `now >= issuedAt + ttlMinutes * 60`. | R5.4 |
| P7 | **Storage round trip.** For any issue state, saving and loading returns an equal state, and the 20-issue limit always removes the oldest. | R7 |
| P8 | **Whole pipeline in memory.** For any small valid issue, running station-side carousel, modem encoder, modem receiver, assembler and reducer end to end yields every page, each VERIFIED, with no audio hardware involved. (10 runs is enough; it is slow.) | R4.1, R11.2 |
| P9 | **Language choice.** For any issue and preferred-language list, the shown page is in the first preferred language available for that page number, else the first available. | R4.4 |

## 7. Dependencies allowed for this spec

`react`, `react-dom`, `idb`, `vite-plugin-pwa`, and `fake-indexeddb` as a dev dependency for P7. A small QR **generator** is needed only by the Station (Brief 05). Ask before adding anything else.

## 8. Suggested order of work

1. Reducer, view-model types and properties P1 to P6, P9, with no UI.
2. Worker with the pipeline; P8.
3. TeletextScreen, FastextKeys, keypad, TrustBadge with static data.
4. Simulator input wired end to end (first visible success, no microphone needed).
5. File input.
6. Microphone capture with the worklet; SignalMeter and Waterfall.
7. Storage and history; trusted stations.
8. Alerts, read aloud, relay.
9. PWA, offline check, About page.

Do steps 1 to 4 before touching the microphone. A working simulator means every later step can be checked on one device.
