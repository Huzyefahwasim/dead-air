---
inclusion: always
---

# Repository structure

```
.
├── .kiro/                    Kiro configuration. Must be committed. Never add it to .gitignore.
│   ├── steering/             Always-on, file-matched and manual (slash command) guidance
│   ├── specs/                One folder per feature spec (created by Kiro's spec workflow)
│   ├── hooks/                Hook definitions (v1 JSON)
│   ├── agents/               Custom agents
│   └── settings/mcp.json     Workspace MCP servers
├── apps/
│   └── web/                  @deadair/web  Vite + React PWA: #/  #/listen  #/station  #/about
├── packages/
│   ├── modem/                @deadair/modem        bytes <-> audio samples. Pure, zero deps.
│   ├── protocol/             @deadair/protocol     pages, issues, manifest, packets, fountain, signing. Pure.
│   ├── chamber/              @deadair/chamber      acoustic channel simulator, trials, reports, CLI. Node.
│   └── chamber-mcp/          @deadair/chamber-mcp  MCP server exposing the chamber to Kiro. Node.
├── chamber/
│   ├── presets.json          Named channel conditions
│   ├── thresholds.json       Must-pass success rates per preset and profile
│   ├── baseline.json         Last accepted results (committed)
│   └── latest.json           Most recent run (git-ignored)
├── content/                  Sample issues, page templates, the compression dictionary source
├── docs/
│   ├── briefs/               Feature briefs: the source of truth each spec is created from
│   ├── status.md             Milestone checklist (printed at session start)
│   ├── kiro-journal.md       Build log (appended by a hook; raw material for the write-up)
│   ├── tuning-log.md         Chamber experiments (created by /chamber-tune)
│   └── field-tests.md        Real-device test results (created by /field-test)
├── scripts/                  Node command-line helpers (modem:wav, issue:wav, decode:wav)
│   └── hooks/                Small Node scripts called by hooks
├── LICENSE                   MIT. Must stay at the repo root.
└── README.md
```

## Dependency direction (never violate)

```
modem  <-  protocol  <-  web
modem  <-  chamber   <-  chamber-mcp
protocol <- chamber
```

`modem` imports nothing from the workspace. `protocol` may import `modem` only for shared constants such as the packet size. `web` never imports `chamber`.

## Inside a package

```
packages/<name>/
├── src/
│   ├── index.ts              The only public entry point. Export types and functions explicitly.
│   └── <module>.ts           One concept per file, 250 lines at most
├── test/
│   ├── <module>.test.ts      Example-based tests
│   └── <module>.prop.test.ts Property-based tests (fast-check)
├── package.json
└── tsconfig.json
```

## Web app layout

```
apps/web/src/
├── main.tsx, App.tsx, router.ts
├── audio/        capture worklet, decode worker, playback, WAV export (browser glue only)
├── state/        stores for issues, trust, station key (IndexedDB)
├── screens/      Home, Listen, Station, About
├── components/   TeletextScreen, StatusBar, FastextKeys, SignalMeter, Waterfall, OnAirLamp ...
├── styles/       tokens.css, teletext.css
└── content/      UI strings
```

## Naming

- Files: `kebab-case.ts`. React components: `PascalCase.tsx`. Types and classes: `PascalCase`. Functions and variables: `camelCase`. Constants: `SCREAMING_SNAKE_CASE`.
- Byte layouts are described in one place (`packages/protocol/src/layout.ts`) and referenced everywhere else. Modem numbers live only in `packages/modem/src/profiles.ts`. No magic numbers elsewhere.
- Spec folders: `acoustic-modem`, `test-chamber`, `chamber-mcp`, `page-protocol`, `receiver-app`, `station-console`.
