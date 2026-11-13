# Brief 03: Page protocol

- **Spec name:** `page-protocol`
- **Package:** `packages/protocol` (`@deadair/protocol`)
- **Depends on:** `@deadair/modem` for the constant `PACKET_BYTES` only
- **Milestone:** M4

## 1. Purpose

Define what travels inside the 70-byte packets: pages of text, a signed manifest that vouches for them, and a looping broadcast schedule that lets a listener start at any moment and lose packets without losing pages.

Three ideas carry the design:

1. **Teletext carousel.** A station repeats a small set of numbered pages forever. A receiver collects them as they pass.
2. **Fountain coding.** After the original blocks of a page have been sent once, the station sends random XOR combinations of them. Any sufficiently large handful of packets rebuilds the page, so a listener who missed some does not have to wait for those exact ones to come round again.
3. **One signature per issue.** A 64-byte signature per page would cost more airtime than the page. Instead a small manifest lists a hash of every page and carries one Ed25519 signature. A page is trusted only if a valid manifest from a trusted station lists its hash.

## 2. Scope

**In scope:** page encoding and compression, objects and blocks, packet header, fountain encoder and decoder, manifest, signing and verification, trust links, carousel schedule, the receiver-side assembler, relay re-packetising, budgets, property tests.

**Out of scope:** audio, storage, user interface, key storage.

## 3. Glossary

| Term | Meaning |
|---|---|
| Page | Number (100 to 899), language, title, up to 15 body lines, priority |
| Issue | The pages a station publishes together, identified by a random 16-bit `issueId` |
| Object | The bytes of one page or of the manifest, as split into blocks for sending |
| Block | 62 bytes of an object |
| Source block | One of an object's own `K` blocks |
| Repair block | The XOR of a pseudo-random subset of an object's source blocks |
| ESI | Encoding symbol id: which block a packet carries |
| Manifest | Signed list of the issue's objects and their hashes |
| Trust store | The station public keys a receiver accepts |

## 4. Frozen layouts

All integers are big-endian. Define every offset once in `layout.ts`.

### 4.1 Packet (70 bytes)

| Offset | Size | Field | Notes |
|---|---|---|---|
| 0 | 1 | `(version << 4) \| type` | `version` = 1. `type`: 0 PAGE, 1 MANIFEST. Anything else is rejected. |
| 1 | 2 | `issueId` | |
| 3 | 2 | `objectId` | Manifest: 0. Page: `pageNumber * 16 + langSlot`, `langSlot` 0 to 15 = index into the manifest's language table. |
| 5 | 1 | `K` | Source blocks in the object. 1 to 6 for a page, 1 to 8 for a manifest. |
| 6 | 2 | `esi` | Less than `K`: source block `esi`. `K` or more: a repair block. |
| 8 | 62 | body | One block. |

### 4.2 Object

`[length: u16][payload: length bytes][zero padding]`, total size `K * 62` where `K = ceil((2 + length) / 62)`. Padding bytes must be zero and are checked on receipt.

### 4.3 Page payload

| Part | Content |
|---|---|
| Byte 0 (flags) | bits 7-6 dictionary id (0 = no dictionary, 1 = dictionary v1); bits 5-4 priority (0 normal, 1 notice, 2 important, 3 urgent); bit 3 right-to-left; bits 2-0 must be zero |
| Rest | Raw DEFLATE (no zlib header) of the UTF-8 page text, using the preset dictionary named by the flags |

Page text: the first line is the title (1 to 32 characters). Then 0 to 15 body lines, each at most 40 characters, separated by `\n`. At most 640 characters in total. No control characters other than `\n`. Text is normalised to Unicode NFC before encoding.

### 4.4 Manifest payload (not compressed)

| Size | Field |
|---|---|
| 2 | Magic bytes `0x44 0x41` ("DA") |
| 1 | `manifestVersion` = 1 |
| 2 | `issueId` |
| 4 | `issuedAt`, Unix time in seconds |
| 2 | `ttlMinutes`, 1 to 65535 |
| 4 | `keyId` = first 4 bytes of SHA-256(public key) |
| 1 + n | Station name: length byte (1 to 24), then UTF-8 bytes |
| 1 + 2m | Language table: count (1 to 16), then two lowercase ASCII letters per language (ISO 639-1) |
| 1 + 11e | Entry table: count (1 to 12), then per entry `objectId` (2), `K` (1), `hash` (8) |
| 64 | Ed25519 signature over every byte above |

Entry `hash` = first 8 bytes of SHA-256 of the page payload (flags byte included; length prefix and padding excluded). Entries are sorted by `objectId` ascending with no duplicates.

### 4.5 Fountain code

- A packet with `esi < K` carries source block `esi` unchanged.
- A packet with `esi >= K` carries the XOR of the source blocks selected by a coefficient vector of `K` bits. The vector is a pure function of `(issueId, objectId, K, esi)`: seed a xorshift32 generator from those four values (document the exact mixing in the design), draw one bit per source block, and if all bits are zero set bit `esi mod K`.
- The decoder solves the linear system over GF(2) by Gaussian elimination once the received vectors reach rank `K`. For `K = 1` every packet is the whole object.

Expected cost, measured for random vectors: with only repair packets, `K = 3` decodes from 3 packets about half the time, from 5 packets 89 percent of the time and from 6 packets 95 percent. Source packets received intact count directly, so in good conditions `K` packets are enough.

### 4.6 Carousel schedule

The carousel is an endless, deterministic sequence of packets for one issue. It is made of **loops**. Every loop has two rounds:

1. **Source round:** every source block of the manifest, then every source block of each page, pages in order of priority (urgent first) then page number.
2. **Repair round:** one fresh repair packet for the manifest, then for each page in the same order `w` fresh repair packets, where `w` is 2 for urgent pages and 1 otherwise.

Repair `esi` values keep counting up from one loop to the next (starting at `K`, wrapping back to `K` after 65535), so every loop's repair round carries new information. A listener with clean reception has the whole issue after one source round. A listener who joined late or lost packets fills the gaps from the repair rounds and the next source round.

Example: 6 pages of 3 blocks and a 3-block manifest give 21 source packets and 7 repair packets per loop: about 49 s per loop on `NEAR-1` and 97 s on `ROOM-1`.

### 4.7 Trust link

`deadair:station:v1:<base64url of the 32-byte public key, no padding>:<percent-encoded station name>`

## 5. Requirements

**R1 Pages**
1. WHEN a valid page is encoded, THE protocol SHALL produce a page payload as in 4.3, choosing dictionary 1 when it makes the payload smaller and dictionary 0 otherwise.
2. IF a page breaks a limit (title length, line count, line length, total length, page number range, forbidden characters), THEN THE encoder SHALL return a typed error that names the limit, and SHALL NOT produce output.
3. IF an encoded page needs more than 6 blocks, THEN THE encoder SHALL return an `over-budget` error stating the size.
4. WHEN a page payload is decoded, THE protocol SHALL return the same number, language, title, body lines, priority and direction that were encoded.

**R2 Objects, blocks and packets**
1. THE protocol SHALL split objects into blocks and build packets exactly as in 4.1 and 4.2.
2. WHEN any 70 bytes are parsed as a packet, THE parser SHALL return either a packet or a typed error, and SHALL NOT throw.
3. THE parser SHALL reject unknown versions and types, `K` of 0 or above the limit for the type, and a manifest type with a non-zero `objectId`.

**R3 Fountain code**
1. THE encoder SHALL produce source and repair packets as in 4.5.
2. WHEN the decoder holds packets of one object whose coefficient vectors have rank `K`, it SHALL return the object bytes.
3. WHILE the rank is below `K`, THE decoder SHALL report how many independent packets it holds and SHALL return no bytes.
4. THE decoder SHALL ignore duplicate packets and packets whose `K` differs from the first accepted packet of that object.
5. IF a decoded object's length field exceeds its capacity or its padding is not all zero, THEN THE decoder SHALL discard the object and report `corrupt-object`.

**R4 Manifest and signing**
1. WHEN an issue is built, THE protocol SHALL create a manifest as in 4.4 and sign it with the station's Ed25519 private key.
2. WHEN a manifest is verified, THE protocol SHALL check the layout, every bound, the entry order, and the signature against the public key whose `keyId` matches, looked up in the trust store.
3. IF no key in the trust store matches the `keyId`, THEN the result SHALL be `unknown-station` (the manifest content may still be shown as unverified).
4. IF the key matches and the signature is wrong, THEN the result SHALL be `bad-signature` and the manifest SHALL be discarded.

**R5 Page trust state**
1. A page SHALL have trust state `verified` only when a manifest with a valid signature from a trusted key lists its `objectId`, its `K` and its hash, and the hash of the received payload matches.
2. A page listed in a valid manifest whose hash does not match SHALL have state `rejected`, and its content SHALL NOT be returned as page content.
3. Every other decoded page SHALL have state `unverified`, with a reason: `no-manifest-yet`, `unknown-station`, or `not-listed`.
4. WHEN a manifest arrives after pages, THE assembler SHALL re-evaluate the state of every page of that issue and emit the changes.

**R6 Assembler (receiver side)**
1. `createAssembler({ trustStore })` SHALL accept packets one at a time, in any order, with duplicates, from several issues mixed together, and emit events: `progress` (object, independent packets held, `K`), `page` (with trust state), `manifest`, `trust-changed`, `issue-complete`.
2. THE assembler SHALL keep issues separate by `issueId`, and SHALL bound its memory: at most 8 issues in progress and 64 packets per object, evicting the least recently updated issue first.
3. WHEN every page listed in a verified manifest is `verified`, THE assembler SHALL emit `issue-complete` once.
4. THE assembler SHALL be able to export, for a complete issue, the exact object bytes of the manifest and every page, for relaying.

**R7 Carousel**
1. `carousel(issue)` SHALL return an endless iterator of 70-byte packets following 4.6, deterministic for a given issue.
2. `carouselFromObjects(objects)` SHALL build the same schedule from exported object bytes, for relays, without access to any private key.

**R8 Budgets**
1. `measureIssue(pages)` SHALL return, per page and in total: characters, payload bytes, blocks, and, per profile, the seconds of airtime of the source round and of one whole loop.
2. IF an issue has more than 12 pages or more than 40 blocks in total, or its manifest needs more than 8 blocks, THEN building it SHALL fail with a typed error.

**R9 Keys and trust links**
1. `generateStationKey(seed32)` SHALL derive a key pair from 32 bytes of caller-supplied randomness. The library itself never calls a random source.
2. `toTrustLink` and `parseTrustLink` SHALL convert between a public key with a name and the link format in 4.7, rejecting malformed links with a typed error.

**R10 Dictionary**
1. Dictionary v1 SHALL be a fixed byte string of at most 2000 bytes, built from `content/dictionary-v1.txt`, committed, and covered by a test that pins its SHA-256, so it cannot change by accident.

**R11 Purity**
1. THE package SHALL NOT use DOM or Node APIs, the clock, or a random source. Time (`now`) and randomness are passed in by the caller.

**R12 Demo station and sample audio**
1. THE package SHALL export a demo station (name "Demo station", key pair derived from the 32-byte seed SHA-256 of the ASCII string `dead-air demo station v1`), documented as public and insecure by design. It is used only for samples, the simulator and tests.
2. A root npm script `issue:wav` SHALL write a WAV file containing a chosen number of carousel loops of an issue, signed with the demo station, in a chosen profile at 48 kHz: `npm run issue:wav -- --issue <path to an issue JSON file> --profile <NEAR-1|ROOM-1> --loops <n> [--out <path>]`. The issue file may be anywhere on disk, in the format of the samples in `content/`. The script SHALL print the number of frames and the duration in seconds. This is the sound source for testing the Receiver before the Station exists.
3. A root npm script `decode:wav` SHALL read a WAV file (mono or stereo, any sample rate from 16 to 48 kHz), run it through the modem's streaming receiver and the protocol's assembler with the demo station trusted, and print every decoded page with its number, title and trust state, followed by a summary line with frames detected and frames that failed error correction: `npm run decode:wav -- <path> [--profile auto|NEAR-1|ROOM-1] [--json]`. It SHALL exit with code 0 when at least one complete page was decoded, 1 when none was, and 2 for a file it cannot read. It is the way to check a recording from a terminal, for example the soundtrack of a video before it is published.

## 6. Correctness properties

Property tests are **required** for this spec.

| Id | Property | Validates |
|---|---|---|
| P1 | **Page round trip.** For any valid page, decoding its payload returns an equal page. | R1.1, R1.4 |
| P2 | **Limits are enforced.** For any page that breaks a limit, encoding returns a typed error and no bytes. | R1.2, R1.3 |
| P3 | **Block round trip.** For any payload within its limit, joining the blocks of its object returns the payload. | R2.1 |
| P4 | **Packet parser is total.** For any 70 bytes, parsing returns a packet or a typed error and never throws. For any packet, parse(serialise(p)) equals p. | R2.2, R2.3 |
| P5 | **Fountain recovery.** For any object and any collection of its packets (source and repair, any order, with duplicates) whose vectors have rank `K`, the decoder returns exactly the object. | R3.1, R3.2, R3.4 |
| P6 | **Fountain never guesses.** For any object and any collection of packets with rank below `K`, the decoder returns no bytes. | R3.3 |
| P7 | **Manifest round trip.** For any valid issue and key, the built manifest parses back to the same fields and verifies under that key. | R4.1, R4.2 |
| P8 | **Tamper evidence.** For any signed manifest, flipping any single bit makes verification fail or parsing return an error. For any page listed in a valid manifest, changing any bit of its payload gives state `rejected`. | R4.4, R5.2 |
| P9 | **Wrong key.** For any two different keys, a manifest signed by one never verifies under the other. | R4.2 |
| P10 | **Order does not matter.** For any issue, any permutation of any packet multiset that contains enough packets yields the same set of pages with the same trust states, and exactly one `issue-complete`. | R5.4, R6.1, R6.3 |
| P11 | **Never over-trust.** For any sequence of packets whatsoever, including random bytes and packets from attacker-made issues signed with untrusted keys, no page is ever emitted as `verified` unless it is byte-identical to a page of an issue signed by a trusted key. | R5.1, R5.3 |
| P12 | **Issues stay separate.** For any two issues with different `issueId`s, interleaving their packets yields the same result as feeding them one after the other. | R6.2 |
| P13 | **Relay equivalence.** For any complete issue, a carousel built from the assembler's exported objects yields pages that are byte-identical and `verified` at a second receiver trusting the original station. | R6.4, R7.2 |
| P14 | **Schedule.** For any issue, the source round of every loop contains every source block of every object exactly once, manifest first, pages in priority order; no repair `esi` of an object repeats within its first 1000 loops; and the iterator is deterministic. | R7.1 |
| P15 | **Decoders are total.** For any byte string given to the page, object, manifest or trust-link decoders, the result is a value or a typed error, with no exception and no unbounded allocation. | R2, R4, R9.2 |

## 7. Public API (shape)

```ts
export interface Page { number: number; lang: string; title: string; lines: string[]; priority: 0|1|2|3; rtl: boolean }
export type Trust =
  | { state: 'verified'; station: { name: string; keyId: string } }
  | { state: 'unverified'; reason: 'no-manifest-yet' | 'unknown-station' | 'not-listed' }
  | { state: 'rejected' };

export function encodePage(page: Page): Result<Uint8Array, PageError>;
export function decodePage(payload: Uint8Array, objectId: number, langs: string[]): Result<Page, DecodeError>;

export async function buildIssue(input: {
  pages: Page[]; stationName: string; issueId: number; issuedAt: number; ttlMinutes: number;
}, key: StationKey): Promise<Result<Issue, IssueError>>;
export function measureIssue(pages: Page[]): IssueBudget;

export function carousel(issue: Issue): Iterator<Uint8Array>;
export function carouselFromObjects(objects: RelayObjects): Iterator<Uint8Array>;

export function createAssembler(opts: { trustStore: TrustStore }): {
  push(packet: Uint8Array, now: number): Promise<AssemblerEvent[]>;
  exportIssue(issueId: number): RelayObjects | undefined;
};

export async function generateStationKey(seed32: Uint8Array): Promise<StationKey>;
export function toTrustLink(publicKey: Uint8Array, name: string): string;
export function parseTrustLink(link: string): Result<{ publicKey: Uint8Array; name: string }, LinkError>;
```

Signing and verification may be `async` because the Ed25519 library is.

## 8. Threat notes (keep these in the design document)

- **Forgery** needs the station's private key. That is the whole security argument.
- **Replay:** anyone can re-broadcast an old valid issue. Receivers therefore always show the issue time prominently and mark an issue as expired once `issuedAt + ttlMinutes` has passed. This is a display rule, not a cryptographic one.
- **Jamming and flooding** cannot be prevented by a receive-only device. Bounded memory (R6.2) keeps a flood from exhausting the phone.
- **8-byte page hashes** are short. Finding a second page with the same 64-bit hash takes on the order of 2^64 attempts, which is acceptable for short-lived bulletins and must be stated as a limit.
- **Trust on first sight is not offered.** A station becomes trusted only when the user adds its link on purpose.

## 9. Suggested modules and order of work

`layout.ts` → `result.ts` (typed results) → `page.ts` + `dictionary.ts` → `object.ts` → `packet.ts` → `fountain.ts` → `manifest.ts` → `keys.ts` + `trust-link.ts` → `issue.ts` + `budget.ts` → `carousel.ts` → `assembler.ts` → `relay.ts` → `demo.ts` → `index.ts`, README, then the `issue:wav` and `decode:wav` scripts (they live in `scripts/`, use the modem's WAV helper, and are the only Node-specific code in this spec).

Ask the `field-editor` agent to draft `content/dictionary-v1.txt` and three sample issues in `content/` (a flood warning, a shelter and water list, a one-page urgent alert) before starting `page.ts`. Use fictional places only.
