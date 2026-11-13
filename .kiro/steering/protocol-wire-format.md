---
inclusion: fileMatch
fileMatchPattern: ["packages/protocol/**", "content/**"]
---

# Protocol and wire-format rules

Full detail lives in `docs/briefs/03-page-protocol.md`. All multi-byte integers are big-endian. All layouts are defined once in `packages/protocol/src/layout.ts`.

## Layers

```
Page text ──compress──> page payload ─┐
                                      ├─> object = [len:2][payload][zero pad] ──split──> K blocks of 62 bytes
Manifest (signed, uncompressed) ──────┘
block(s) ──fountain──> packet = [header:8][body:62] = 70 bytes ──modem──> one frame
```

## Packet header (8 bytes, frozen)

| Offset | Size | Field | Notes |
|---|---|---|---|
| 0 | 1 | `version << 4 \| type` | version = 1. type 0 = PAGE, 1 = MANIFEST |
| 1 | 2 | `issueId` | Random per published issue |
| 3 | 2 | `objectId` | 0 for the manifest; `pageNumber * 16 + langSlot` for a page |
| 5 | 1 | `K` | Source blocks in this object, 1 to 8 |
| 6 | 2 | `esi` | Block id. `esi < K`: that source block. `esi >= K`: a repair block |

## Object

`[length: u16][payload][zero padding]`, padded to `K * 62` bytes, `K = ceil((2 + length) / 62)`. A page may use at most 6 blocks, a manifest at most 8.

## Page payload

- Byte 0, flags: bits 7-6 dictionary id (0 none, 1 dictionary v1), bits 5-4 priority (0 normal to 3 urgent), bit 3 right-to-left, bits 2-0 zero.
- Then raw DEFLATE of the UTF-8 text. First line is the title (32 characters at most). Up to 15 body lines follow. 640 characters at most in total.

## Manifest payload (not compressed)

`'D' 'A'`, manifestVersion (1), issueId (2), issuedAt unix seconds (4), ttlMinutes (2), keyId (4), station name (1 length byte + UTF-8, 24 bytes at most), language table (1 count byte + 2 ASCII bytes each), entry table (1 count byte, then per entry objectId (2), K (1), hash (8)), signature (64).

- `keyId` = first 4 bytes of SHA-256(public key).
- Entry `hash` = first 8 bytes of SHA-256(page payload, flags byte included, length prefix and padding excluded).
- `signature` = Ed25519 over every manifest byte before the signature.

## Rules that must always hold

1. **Verification is all-or-nothing per page.** A page is `verified` only if a manifest with a valid signature from a trusted key lists its objectId, its K and its hash, and the hash matches. Anything else is `unverified`. A hash mismatch under a valid manifest is `rejected` and the page is not shown as content.
2. **Never show unverified content with verified styling**, and never drop the distinction in an API. Every page object returned by the library carries its trust state.
3. **Relays re-send the original object bytes.** A relay never re-compresses, re-orders, edits or re-signs. It re-packetises the stored bytes with the same `issueId`, `objectId` and `K`.
4. **Decoders are total.** Any byte sequence, however malformed, results in a typed error value. Never a thrown exception escaping the public API, never an infinite loop, never an allocation proportional to an attacker-chosen length without a bound.
5. **Bounds first.** Check every length and count against the limits above before using it.
6. **Fountain coefficients are a pure function** of `(issueId, objectId, K, esi)`, documented, and identical in sender and receiver. Source blocks are sent first (systematic), repair blocks after.
7. **Changing a layout, the dictionary bytes or the coefficient function is a breaking change.** It needs a new version value and the user's go-ahead. The dictionary is identified by its id in the flags byte; never edit dictionary v1 after it ships, add v2 instead.
8. **Keys.** Private keys never leave the device except through an explicit, user-triggered export. Never log key material. Use `@noble/ed25519`; do not implement curve arithmetic.

## Budgets

| Thing | Limit |
|---|---|
| Page text | 640 characters, 1 title line + 15 body lines |
| Page object | 6 blocks (370 payload bytes) |
| Issue | 12 pages, 40 blocks in total |
| Manifest | 8 blocks |
| Trust link | `deadair:station:v1:<base64url public key>:<url-encoded name>` |
