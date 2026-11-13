# Dead Air

**When the network dies, the radio screams.**

Dead Air sends short, signed pages of text as sound, so a phone with no internet can read them off a radio or a loudspeaker. It brings back two dead technologies, the dial up modem and teletext, for internet shutdowns and disasters.

Built for [Kiroween 2026](https://kiroween.devpost.com/) (category: Resurrection) with [Kiro](https://kiro.dev).

> Status: in development. Live demo: `[[add the address after M7]]`

## How it works

1. **Station** (`#/station`): an operator writes a few pages. The app signs them and plays them as a loop of modem tones through any speaker or transmitter, or exports a WAV file.
2. **Receiver** (`#/listen`): a phone listens through its microphone, offline. Pages appear on a teletext style screen as they arrive, each marked VERIFIED or UNVERIFIED.
3. **Relay:** any phone that has the pages can play them on to the next. The station's signature travels with them.

Under the hood: a modem with 64 tones that listens only for how loud each one is, Reed Solomon error correction, pages sent in pieces that can arrive in any order so a listener can join at any moment, and one Ed25519 signature per issue.

## Limits, stated plainly

* Text only, at tens of bytes per second. By design a six page issue takes roughly 40 to 80 seconds to receive. Measured times are in `docs/field-tests.md`.
* The Receiver must be opened once while online before it works offline.
* Rules about data tones on licensed radio bands differ by country. A loudspeaker avoids the question.
* Key storage in the browser is fine for demonstrations and small community use. It is not built for settings where a stolen key would put someone in danger.
* A simulator only approximates rooms and devices. Results on real devices are in `docs/field-tests.md`.

## Try it

`[[fill in after M7: the steps with two devices, and the "Simulate a broadcast" fallback with one]]`

## Develop

```
npm install
npm run dev            # web app
npm test               # unit and property tests
npm run chamber:quick  # acoustic regression gate
```

Requires Node 20 or newer. `ffmpeg` is optional and enables the codec presets in the test chamber.

## Repository map

| Path | Content |
|---|---|
| `apps/web` | The Station and Receiver (Vite, React, PWA) |
| `packages/modem` | Bytes to audio and back. Pure TypeScript, no dependencies |
| `packages/protocol` | Pages, manifest, signatures, fountain coding, carousel |
| `packages/chamber` | Acoustic channel simulator and test runner |
| `packages/chamber-mcp` | MCP server that lets a coding agent measure the modem |
| `chamber/` | Test conditions and pass marks |
| `.kiro/` | Kiro specs, steering, hooks, custom agents, MCP settings |
| `docs/briefs/` | The feature briefs each spec was created from |
| `docs/kiro-journal.md` | How this was built, session by session |

## Built with Kiro

`[[summarise from docs/submission/writeup.md: specs, property tests, steering, hooks, MCP, custom agents, power, and which Kiro surfaces were used]]`

Planning briefs and the starting configuration were prepared before development with an AI assistant. Specs, code and tests were produced in Kiro. Details are in `docs/kiro-journal.md`.

## Third party assets

`[[list each font and library with its license once chosen]]`

## License

MIT. See `LICENSE`.
