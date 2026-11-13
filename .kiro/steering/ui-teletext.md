---
inclusion: fileMatch
fileMatchPattern: ["apps/web/**"]
---

# Interface rules: the teletext look, done accessibly

Full detail lives in `docs/briefs/04-receiver-app.md` and `docs/briefs/05-station-console.md`.

## The idea

The screen looks like teletext because teletext **is** the product: small numbered pages of text on a black screen. The look is functional, not decoration. Evoke the genre generically. Never use the names, logos or exact layouts of real teletext services or broadcasters.

## Grid and type

- Content area is a 40-column text grid. Pages render as lines of text in a monospace face, not as individual cells, so non-Latin and right-to-left scripts still shape correctly.
- Font: a self-hosted, openly licensed monospace or teletext-style face, shipped in the repo with its license file. Fall back to `ui-monospace, monospace`. No font requests to third-party hosts.
- Size the grid with `ch` and `clamp()` so 40 columns fit a 320 px wide phone without horizontal scrolling. Titles may use double height (`transform: scaleY(2)` on a block line).
- Header row on every page: page number on the left (`P101`), station or app name in the middle, clock or issue time on the right.

## Colour tokens (`styles/tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--tt-black` | `#000000` | Background |
| `--tt-white` | `#ffffff` | Body text |
| `--tt-yellow` | `#ffff00` | Titles, emphasis |
| `--tt-cyan` | `#00ffff` | Links, page numbers |
| `--tt-green` | `#00ff00` | Verified state, OK |
| `--tt-red` | `#ff0000` | Background blocks only, with white or yellow text |
| `--tt-blue` | `#0000ff` | Background blocks only |
| `--tt-magenta` | `#ff00ff` | Background blocks only |

Text on black may be white, yellow, cyan or green only. Red, blue and magenta fail contrast as text on black: use them as block backgrounds with white or yellow text on top.

## Components

- **TeletextScreen**: header row, up to 16 lines, footer row.
- **FastextKeys**: four coloured soft keys at the bottom (red, green, yellow, blue), each a real `<button>` with a text label. Receiver: red = Listen / Stop, green = Index, yellow = Read aloud, blue = Pass it on.
- **PageKeypad**: three-digit page entry, like a TV remote. Also reachable by typing digits on a keyboard.
- **TrustBadge**: three states, each with icon + word + colour (never colour alone): `VERIFIED <station>`, `UNVERIFIED`, `REJECTED`.
- **SignalMeter** and **Waterfall**: live view of the 64 tone energies. This is the "is my phone hearing it" feedback, so it must update while listening even before any frame decodes.
- **OnAirLamp** (Station): lit only while audio is actually playing.
- **BudgetMeter** (Station): characters, compressed bytes, blocks and seconds of airtime for the current page and the whole issue.

## Atmosphere, with restraint

The haunting comes from the subject: a dead signal that speaks. Allowed: a faint phosphor glow, scanlines at low opacity, static on the Waterfall when there is no signal, the copy "DEAD AIR" when silent. Not allowed: jump scares, flashing above 3 times per second, effects that reduce text contrast, sound effects other than the modem itself. Everything decorative is disabled under `prefers-reduced-motion: reduce`.

## Accessibility (requirements, not wishes)

1. All text meets WCAG AA contrast at least; body text on black meets AAA.
2. Every control is a native element or has a correct role, name and keyboard behaviour. Full keyboard operation. Visible focus ring (2 px cyan outline).
3. Touch targets at least 44 x 44 CSS pixels.
4. New pages and trust-state changes are announced through an `aria-live="polite"` region; an urgent verified page uses `assertive`.
5. **A verified new page triggers `navigator.vibrate` where available and a visible full-width banner**, because many users of this app cannot hear the broadcast.
6. Text scales to 200 percent without loss of content. Respect the user's font-size setting.
7. Pages flagged right-to-left render with `dir="rtl"`; set `lang` on page content from the page's language code.
8. Read aloud uses `speechSynthesis` and must be stoppable with one press.

## Copy

Short, literal, calm. Sentence case. No jargon on the Receiver: say "Hold your phone near the speaker", not "Awaiting preamble". Errors say what happened and what to do next. All UI strings live in `src/content/strings.ts`.

## Privacy and offline

- The Receiver route makes no network requests after the app shell has loaded. The service worker precaches everything it needs.
- Microphone audio is processed on the device and never stored or sent anywhere. Say so on the Listen screen.
- No analytics, no third-party scripts.
