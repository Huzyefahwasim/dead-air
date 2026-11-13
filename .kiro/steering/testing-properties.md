---
inclusion: fileMatch
fileMatchPattern: ["**/*.test.ts", "**/*.prop.test.ts", "**/test/**", ".kiro/specs/**"]
---

# Testing and correctness properties

## Why this project leans on property tests

A modem and a wire protocol are made of statements that must hold **for any input**: any packet decodes to itself, any large-enough set of blocks rebuilds the object, any tampered byte breaks verification. Example tests cannot cover that. Each spec's `design.md` therefore carries a "Correctness Properties" section, and each property becomes a fast-check test.

## Conventions

- Tools: Vitest + fast-check. Example tests in `*.test.ts`, property tests in `*.prop.test.ts`.
- One `describe` per property, named with its id and requirement links, so failures trace back to the spec:

```ts
// Property 1: round trip. Validates: Requirements 2.1, 3.1, 4.2
describe('P1 round trip', () => {
  it('decodes any packet it encoded', () => {
    fc.assert(
      fc.property(arbPacket(), arbProfile(), arbSampleRate(), arbChunking(), (pkt, prof, fs, cuts) => {
        // ...
      }),
      { numRuns: 100 },
    );
  });
});
```

- Shared generators live in `test/arbitraries.ts` in each package: `arbPacket()` (exactly 70 bytes), `arbProfile()`, `arbSampleRate()` (16000, 32000, 44100, 48000), `arbChunking()`, `arbPageText()`, `arbIssue()`.
- `numRuns`: 100 by default. Audio properties are slow, so 25 runs is acceptable there; say so in a comment. Never go below 20.
- Randomness inside a test (noise, channel effects) comes from a seeded generator whose seed is a fast-check argument, so every failure can be replayed.
- When a property fails, copy fast-check's seed and path into a regression test (`fc.assert(..., { seed, path })`) before fixing anything.

## What a good property looks like here

| Shape | Example |
|---|---|
| Round trip | `decode(encode(x)) === x` for packets, pages, objects, manifests |
| Invariant | Every output sample is within -1 to 1 |
| Chunking independence | Feeding samples in any chunk sizes gives the same packets |
| Recovery | Any set of fountain packets with rank K rebuilds the object |
| Tamper evidence | Flipping any bit of a signed manifest or a listed page makes verification fail |
| Totality | Any random byte string given to a decoder returns a typed error, never throws |
| No-op | In a noiseless channel the compensation steps change nothing |

## Rules

1. A property test that fails is never "fixed" by narrowing its generator, lowering `numRuns`, adding `fc.pre` conditions that were not in the spec, or relaxing the assertion. Fix the code, or stop and tell the user the property or requirement is wrong.
2. Tests must be deterministic and must not touch the network, the microphone, timers or the real clock.
3. Keep the whole suite under 60 s. Anything statistical or long (frame success rates over hundreds of frames) belongs in the chamber, not in Vitest.
4. Chamber checks are separate: `npm run chamber:quick` is the gate, `chamber/thresholds.json` holds the pass marks, and only the user edits that file.
5. Do not test private helpers through deep imports from other packages. Test through `src/index.ts` exports, or co-located tests inside the same package.
