---
inclusion: always
---

# Technology and constraints

## Stack

- **Language:** TypeScript, `strict` on, ES modules only. Node 20 or newer for tooling.
- **Monorepo:** npm workspaces (`packages/*`, `apps/*`). No other monorepo tool.
- **Tests:** Vitest. Property-based tests with fast-check. Property tests are first-class, not optional extras.
- **Web app:** Vite + React + TypeScript, one app with hash routes. Plain CSS with custom properties (no CSS framework). PWA via `vite-plugin-pwa`.
- **Audio in the browser:** `getUserMedia` + `AudioWorklet` for capture, a Web Worker for decoding, `AudioBufferSourceNode` for playback.
- **Storage:** IndexedDB (through the small `idb` wrapper) for issues, trusted stations and the station key.
- **Crypto:** Ed25519 via `@noble/ed25519`, SHA-256 via `@noble/hashes`. Never hand-write cryptographic primitives.
- **Compression:** raw DEFLATE with a preset dictionary via `pako`.
- **MCP server:** `@modelcontextprotocol/sdk`, stdio transport, Node.
- **Formatting:** Prettier defaults. No ESLint unless a spec asks for it.

## Hard constraints

1. **No backend, no paid service, no API key in the core flow.** The deployed app is static files. Judges must be able to use it free of charge for months.
2. **The Receiver makes zero network requests after load.** No analytics, no fonts from a CDN, no remote images. Fonts are self-hosted with their license file.
3. **`packages/modem` and `packages/protocol` are pure.** No DOM, no Web Audio, no Node built-ins, no `Date.now()` or `Math.random()` inside library code (time and randomness are passed in). They must run unchanged in the browser, in a Worker and in Node.
4. **`packages/modem` has zero runtime dependencies.**
5. **Determinism.** Given the same inputs, encoders produce identical bytes and samples. Any pseudo-randomness uses an explicit seeded generator.
6. **The on-air format is frozen** once a spec marks it frozen (tone plan, timing, preamble, mapping, FEC, packet and manifest layouts). Changing it needs a version bump and an explicit instruction from the user.
7. **Microphone constraints:** always request `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false`, mono.
8. **Sample rates:** never assume 48 kHz. Read the real rate from the `AudioContext` and pass it down.

## Dependency policy

Ask before adding any dependency not listed above. Prefer writing 50 lines over adding a package. Every dependency must be MIT, Apache-2.0, BSD or ISC licensed.

## Root npm scripts (keep these names stable; hooks and docs call them)

| Script | Does |
|---|---|
| `npm run typecheck` | `tsc -b` across the workspace |
| `npm test` | Vitest, all unit and property tests, non-watch |
| `npm run dev` | Vite dev server for `apps/web` |
| `npm run build` | Build every package and the web app |
| `npm run format` | Prettier write |
| `npm run chamber -- <args>` | One chamber trial (see the chamber spec) |
| `npm run chamber:quick` | Fast must-pass subset, under 90 s, exit code 1 on any threshold failure |
| `npm run chamber:full` | Full matrix, writes `chamber/latest.json` |
| `npm run modem:wav -- <args>` | Write one modem frame to a WAV file, for listening |
| `npm run issue:wav -- <args>` | Write carousel loops of an issue to a WAV file (demo station key) |
| `npm run decode:wav -- <file>` | Decode a WAV file back into pages and print each with its trust state |

## Browser targets

Latest two versions of Chrome, Edge, Firefox and Safari, on desktop, Android and iOS. Feature-detect and show a clear message when something is missing (for example `AudioWorklet` or microphone permission).

## Performance budgets

- Decoder processes audio at least 4x faster than real time on a mid-range phone.
- Web app shell under 300 kB gzipped. First load usable on a slow 3G profile.
- Unit and property test suite under 60 s.

## Hosting

Static hosting with HTTPS (microphone access requires a secure context). Default: GitHub Pages deployed by a GitHub Actions workflow, with Vite `base` set for the repository sub-path.
