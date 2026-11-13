# Brief 01: Acoustic modem

- **Spec name:** `acoustic-modem`
- **Package:** `packages/modem` (`@deadair/modem`)
- **Depends on:** nothing
- **Milestone:** M1

## 1. Purpose

Turn a 70-byte packet into a short burst of audible tones (a frame) and turn microphone audio back into packets. Everything else in Dead Air sits on top of these two functions.

The modem is a multi-tone FSK design that detects **energy, never phase**. That choice is what lets it survive cheap speakers, clipping, lossy audio codecs, clock differences between devices and room echo.

## 2. Scope

**In scope:** profiles, frame encoder, Reed-Solomon and CRC, whitening, streaming receiver for both profiles, telemetry for a signal meter, a small WAV helper, property tests.

**Out of scope:** microphone and speaker access, Web Audio, pages, signatures, fountain coding, the channel simulator (Brief 02), any user interface.

## 3. Glossary

| Term | Meaning |
|---|---|
| Tone | One of 64 fixed frequencies |
| Sub-channel | A group of 4 adjacent tones. Exactly one sounds per symbol, carrying 2 bits |
| Symbol | One time slot in which all 16 sub-channels sound one tone each (32 bits, 4 bytes) |
| Preamble | 4 known symbols at the start of a frame, used to find it |
| Codeword | 96 bytes: 72 data bytes + 24 Reed-Solomon parity bytes |
| Packet | The 70 bytes of user data inside a codeword (the other 2 data bytes are a CRC) |
| Frame | Preamble + 24 data symbols = one codeword on air |
| Profile | A named set of timings: `NEAR-1` or `ROOM-1` |
| Hop | The step, about 5 ms, between successive analysis windows in the receiver |

## 4. Frozen on-air format

Two devices must agree on everything in this section. Copy these values exactly. They may only change with a new profile id.

### 4.1 Tone plan (both profiles)

- 64 tones. Tone `i` has frequency `1000 + 50 * i` Hz, for `i` = 0 to 63 (1000 Hz to 4150 Hz).
- 16 sub-channels. Sub-channel `c` (0 to 15) owns tones `4c`, `4c+1`, `4c+2`, `4c+3`.
- In every symbol, each sub-channel sounds exactly one of its tones. Value `v` (0 to 3) means tone `4c + v`.

### 4.2 Profiles

| | `NEAR-1` | `ROOM-1` |
|---|---|---|
| Symbol period | 60 ms | 120 ms |
| Tone-on time | 50 ms | 110 ms |
| Silent gap at the end of each symbol | 10 ms | 10 ms |
| Rise and fall ramps (inside the tone-on time) | 5 ms each, raised cosine | 5 ms each, raised cosine |
| Preamble pattern (value sent on **all** sub-channels, per symbol) | 0, 3, 1, 2 | 2, 1, 3, 0 |
| Symbols per frame | 4 preamble + 24 data | 4 preamble + 24 data |
| Frame duration | 1.68 s | 3.36 s |
| Minimum silence between frames | 60 ms | 120 ms |
| Packets per second on a loop | 0.575 | 0.287 |
| Packet bytes per second on a loop | 40.2 | 20.1 |
| Intended use | Phone held at the speaker; files; cables | Across a room with echo |

### 4.3 Symbol waveform

For a symbol, sum one sinusoid per sub-channel at that sub-channel's chosen tone frequency, starting at the symbol's first sample. Multiply the sum by an envelope that rises from 0 to 1 over the first 5 ms (raised cosine), stays at 1, and falls to 0 over the last 5 ms of the tone-on time. The rest of the symbol period is silence.

Per-tone start phases are a fixed table chosen to keep the crest factor low (for example from a seeded generator). The phases are **not** part of the on-air contract, because receivers ignore phase, but they must be fixed so encoding is deterministic.

After building the whole frame, scale it so its largest absolute sample is 0.9.

### 4.4 Bytes to tones

A frame carries 96 bytes in 24 data symbols, 4 bytes per symbol. Byte `b` (0 to 95) is sent in data symbol `floor(b / 4)`. Within its symbol, byte number `j = b mod 4` uses sub-channels `4j`, `4j+1`, `4j+2`, `4j+3`, most significant bit pair first: bits 7-6 go to sub-channel `4j`, bits 5-4 to `4j+1`, bits 3-2 to `4j+2`, bits 1-0 to `4j+3`.

### 4.5 Codeword

```
packet (70 bytes)
  -> append CRC-16 of the packet, high byte first            = 72 bytes
  -> Reed-Solomon encode, append 24 parity bytes             = 96 bytes
  -> XOR with the 96-byte whitening sequence                 = 96 bytes on air
```

- **CRC:** CRC-16/CCITT-FALSE. Polynomial 0x1021, initial value 0xFFFF, no bit reflection, no final XOR. Check value: the ASCII bytes `123456789` give 0x29B1.
- **Reed-Solomon:** RS(96,72) over GF(2^8), a shortened RS(255,231). Field polynomial 0x11D (x^8 + x^4 + x^3 + x^2 + 1), generator element 2. Code generator polynomial is the product of `(x - 2^i)` for `i` = 0 to 23. Systematic: the 72 data bytes come first, then 24 parity bytes. Corrects up to 12 wrong bytes.
- **Whitening:** a fixed 96-byte sequence from xorshift32. Start with `s = 0xDEADA1B5`. For each byte: `s ^= s << 13; s ^= s >>> 17; s ^= s << 5` (all as unsigned 32-bit), then take `s & 0xFF`. The first 8 bytes are `f8 99 bf 52 92 04 68 a4` and the last 4 are `ce 1f 5d 10`. Whitening is applied after RS encoding and removed before RS decoding. It guarantees every tone is used about a quarter of the time whatever the payload.

## 5. Requirements

Write these as user stories with EARS acceptance criteria. Keep the numbering.

**R1 Profiles**
1. THE modem SHALL define exactly the profiles `NEAR-1` and `ROOM-1` with the values in section 4, in a single module.
2. THE modem SHALL derive every sample count from a profile and a sample rate. No other module contains timing or frequency literals.
3. IF a sample rate is below 16000 Hz or is not a whole multiple of 100 Hz, THEN THE modem SHALL throw a `RangeError` that names the rate.

**R2 Encoding**
1. WHEN `encodeFrame(packet, profileId, sampleRate)` is called with a 70-byte packet, THE modem SHALL return one frame as a `Float32Array` whose length is exactly 28 symbol periods.
2. THE samples of every encoded frame SHALL lie between -1 and 1, and the largest absolute sample SHALL be 0.9 within 0.001.
3. THE encoder SHALL be deterministic: equal inputs give bit-identical output.
4. IF the packet is not exactly 70 bytes, THEN THE modem SHALL throw a `RangeError`.
5. WHEN `encodeFrames(packets, profileId, sampleRate)` is called, THE modem SHALL return the frames in order, each followed by one symbol period of silence.

**R3 Codeword**
1. THE modem SHALL build codewords exactly as in section 4.5.
2. WHEN a received codeword has 12 or fewer wrong bytes, THE decoder SHALL return the original packet and the number of bytes it corrected.
3. IF Reed-Solomon decoding fails or the CRC does not match, THEN THE decoder SHALL return a failure value with a reason, and SHALL NOT return a packet.

**R4 Streaming receiver**
1. `createReceiver({ sampleRate, profiles, onEvent })` SHALL return an object with `push(chunk: Float32Array)` and `reset()`.
2. WHEN audio containing a valid frame has been pushed, in chunks of any sizes, THE receiver SHALL emit exactly one `frame` event carrying the packet, the profile id and statistics.
3. THE sequence of events SHALL NOT depend on how the audio was divided into chunks.
4. THE receiver SHALL search for every enabled profile at the same time.
5. WHEN a candidate frame fails decoding, THE receiver SHALL emit a `frame-bad` event and SHALL resume searching no later than one hop after that candidate's start, so a real frame that overlaps a false candidate is still found.
6. THE receiver SHALL use bounded memory: it keeps at most 6 seconds of audio and does not grow with listening time.
7. WHEN a chunk contains `NaN` or infinite samples, THE receiver SHALL treat them as zero and SHALL NOT throw.
8. WHEN `reset()` is called, THE receiver SHALL discard all buffered audio and partial detections.

**R5 Detection**
1. THE receiver SHALL declare a candidate only where the preamble score (defined in section 8) is a local maximum and passes the detection rule. The starting rule is: score at least 0.6, and each of the four preamble symbols at least 0.35. These two numbers are tunable receiver internals kept in one place.
2. WHILE the input contains no Dead Air signal (silence, white noise, speech-like noise, steady tones), THE receiver SHALL emit no `frame` event.

**R6 Decisions**
1. THE receiver SHALL compensate tones contaminated by steady interference, starting from the guarded rule in section 8.
2. THE receiver SHALL subtract the echo of the previous symbol, starting from the method in section 8 (a factor estimated from the preamble).
   Both are tunable internals: they may later be changed under the `/chamber-tune` procedure, as long as R6.3 and the chamber pass marks keep holding.
3. WHEN the channel is noiseless (encoder output fed straight to the receiver), THE receiver SHALL correct zero bytes, whatever internals are in use.

**R7 Telemetry**
1. Every `frame` and `frame-bad` event SHALL carry: profile id, start position in samples since the receiver was created or reset, preamble score, lowest per-symbol preamble score, echo factor `rho`, an SNR estimate in dB, and the 96 raw codeword bytes as decided before error correction.
2. A `frame` event SHALL also carry the packet and the number of corrected bytes. A `frame-bad` event SHALL carry a reason (`rs-failed` or `crc-failed`).
3. THE receiver SHALL emit a `level` event about every 100 ms of audio with the latest 64 tone energies, the in-band RMS level and the best preamble score seen in that interval. This drives the signal meter and waterfall.

**R8 Performance**
1. Pushing 1 second of 48 kHz audio SHALL take less than 250 ms on a laptop-class CPU (benchmark test; target under 100 ms).
2. THE receiver SHALL NOT allocate inside per-hop or per-sample loops.

**R9 Sample rates**
1. Encoding and decoding SHALL work at 16000, 32000, 44100 and 48000 Hz.
2. A frame encoded at 48000 Hz and linearly resampled to 44100 Hz SHALL decode at 44100 Hz.

**R10 WAV helper**
1. `encodeWavPcm16(samples, sampleRate)` SHALL return a valid mono 16-bit PCM WAV file as bytes.
2. `decodeWavPcm16(bytes)` SHALL return samples and sample rate for mono or stereo 16-bit PCM WAV (stereo is averaged), and a typed error for anything else.

**R11 Purity and packaging**
1. THE package SHALL have zero runtime dependencies and SHALL NOT use DOM, Web Audio or Node APIs, `Math.random()` or `Date.now()`.
2. THE package SHALL export its public API and types from `src/index.ts` only.

**R12 Documentation**
1. THE package SHALL include a README with the format summary of section 4 and one usage example each for encoding and receiving.

## 6. Correctness properties

Each becomes a fast-check property test. Property tests for this spec are **required**, not optional.

| Id | Property | Validates |
|---|---|---|
| P1 | **Round trip.** For any 70-byte packet, any profile, any supported sample rate, any lead-in silence from 0 to 500 ms, trailing silence of at least one symbol, and any chunking, the receiver emits exactly one `frame` event whose packet equals the input. | R2, R3, R4.2 |
| P2 | **Amplitude.** For any packet, every sample of the frame is within -1 to 1 and the peak is 0.9. | R2.2 |
| P3 | **Determinism.** For any inputs, two calls to the encoder give identical arrays. | R2.3 |
| P4 | **Correction.** For any codeword and any pattern of 1 to 12 byte errors at any positions, decoding returns the original packet and the right count. | R3.2 |
| P5 | **No false accept.** For any codeword and any pattern of 13 to 96 byte errors, decoding never returns a packet different from the original. | R3.3 |
| P6 | **Chunking independence.** For any audio buffer and any two ways of cutting it into chunks, the two event sequences are equal. | R4.3 |
| P7 | **Several frames.** For any list of 1 to 4 packets, each with its own profile, separated by 1 to 10 symbol periods of silence, the receiver emits all of them, in order, once each. | R4.2, R4.4 |
| P8 | **Noise rejection.** For any seed, 5 seconds of white noise at any level, or of synthetic speech-like noise, produces zero `frame` events. | R5.2 |
| P9 | **Clean channel is untouched.** For any packet in noiseless loopback, the corrected-byte count is 0. | R6.3 |
| P10 | **Mapping is a bijection.** For any 96 bytes, tones-to-bytes of bytes-to-tones returns them, and every symbol has exactly one tone per sub-channel. | section 4.4 |
| P11 | **Whitening undoes itself.** For any 96 bytes, whitening twice returns them. | section 4.5 |
| P12 | **WAV round trip.** For any samples within -1 to 1, decode(encode(x)) equals x to within 1/32767. | R10 |
| P13 | **Totality.** For any `Float32Array` at all, including `NaN`, infinities and huge values, `push` does not throw. | R4.7 |

## 7. Public API (shape, not final names)

```ts
export type ProfileId = 'NEAR-1' | 'ROOM-1';
export const PACKET_BYTES = 70;
export const CODEWORD_BYTES = 96;
export const PROFILES: Readonly<Record<ProfileId, Profile>>;

export function encodeFrame(packet: Uint8Array, profile: ProfileId, sampleRate: number): Float32Array;
export function encodeFrames(packets: Uint8Array[], profile: ProfileId, sampleRate: number): Float32Array;
export function frameSeconds(profile: ProfileId): number; // frame + mandatory gap

export interface FrameStats {
  profile: ProfileId; startSample: number; preambleScore: number; minSymbolScore: number;
  rho: number; snrDb: number; rawCodeword: Uint8Array;
}
export type ReceiverEvent =
  | { type: 'frame'; packet: Uint8Array; correctedBytes: number; stats: FrameStats }
  | { type: 'frame-bad'; reason: 'rs-failed' | 'crc-failed'; stats: FrameStats }
  | { type: 'level'; toneEnergies: Float32Array; inBandRms: number; bestScore: number };

export function createReceiver(opts: {
  sampleRate: number; profiles?: ProfileId[]; onEvent: (e: ReceiverEvent) => void;
}): { push(chunk: Float32Array): void; reset(): void };

export function encodeWavPcm16(samples: Float32Array, sampleRate: number): Uint8Array;
export function decodeWavPcm16(bytes: Uint8Array): Result<{ samples: Float32Array; sampleRate: number }>;
```

## 8. Baseline receiver (tunable internals, known to work)

1. **Tone energies.** Every hop (`round(0.005 * sampleRate)` samples), take a 40 ms Hann-windowed slice and compute the energy at each of the 64 exact tone frequencies (Goertzel or a direct DFT at that frequency).
2. **Preamble score.** For hop `h` and a profile with `P` hops per symbol: for each preamble symbol `s` (0 to 3) and sub-channel `c`, compute `E[h + s*P][4c + pattern[s]] / (sum of the 4 energies of sub-channel c in that row)`. The symbol score is the mean over the 16 sub-channels. The preamble score is the mean of the 4 symbol scores. Random input gives about 0.25.
3. **Candidate.** Local maximum of the preamble score, at least 0.6, with every symbol score at least 0.35.
4. **Rows.** From the candidate's start sample, compute 28 rows of tone energies at exact symbol spacing in samples (`start + n * symbolSamples`), not by adding rounded hops.
5. **Floor compensation, guarded.** For each tone, its floor is the lower quartile of its 28 energies. Let `typicalFloor` be the median of the 64 floors and `typicalActive` the median over rows and sub-channels of the strongest tone in each sub-channel. A tone is contaminated only if `floor > 4 * typicalFloor` and `floor > 0.02 * typicalActive`. Divide a contaminated tone's energies by `floor / typicalFloor`.
6. **Echo subtraction.** For preamble symbols 1 to 3 and each sub-channel, take the ratio of the previous symbol's tone energy now to its energy one symbol earlier. `rho` is the median of those 48 ratios, clamped to 0 to 0.9. Replace every row `n >= 1` by `max(row[n] - rho * row[n-1], 0)`.
7. **Decide** the strongest tone in each sub-channel, map to bytes, remove whitening, RS-decode, check the CRC.
8. **SNR estimate.** `10 * log10(mean energy of chosen tones / mean energy of the other tones)` over the data symbols.

## 9. Reference results from a pre-build simulation

Before this brief was written, the baseline in section 8 was modelled in a throwaway numerical simulation (80 random frames per cell; codecs through ffmpeg, 20 frames per cell). The table shows the percentage of frames delivered. Use it to know what is achievable. It is **not** a measurement of your implementation: confirm everything in the chamber (Brief 02) and on real devices.

Definitions of in-band SNR and of the synthetic room are in `.kiro/steering/modem-dsp.md`. "Room 0.5 s, 0 dB" means RT60 of 0.5 s and a direct-to-reverberant ratio of 0 dB.

| Condition | `NEAR-1` | `ROOM-1` |
|---|---|---|
| Clean | 100 | 100 |
| White noise, in-band SNR 3 dB | 100 | 100 |
| White noise, 2 dB | 100 | 100 |
| White noise, 1 dB | 99 | 74 |
| White noise, 0 dB | 40 | 1 |
| Room 0.3 s, +10 dB, SNR 20 dB (phone near speaker) | 100 | 100 |
| Room 0.3 s, 0 dB, SNR 20 dB | 82 | 100 |
| Room 0.5 s, +5 dB, SNR 20 dB | 100 | 100 |
| Room 0.5 s, 0 dB, SNR 10 dB (living room, across the room) | 15 | 96 |
| Room 0.5 s, -5 dB, SNR 20 dB | 0 | 91 |
| Room 0.8 s, -5 dB, SNR 20 dB (echoey hall) | 0 | 11 |
| Steady tone on a tone frequency, 3x a tone's amplitude | 100 | 100 |
| Steady tone between two tone frequencies, 10x | 55 | 65 |
| Speech-like interference, signal 10 dB above it | 100 | 100 |
| Speech-like interference, 5 dB | 100 | 94 |
| Speech-like interference, 0 dB | 21 | 14 |
| Telephone band 300 to 3400 Hz, SNR 15 dB | 100 | 100 |
| Hard clipping at 10x gain, SNR 10 dB | 100 | 100 |
| Clock offset of +/-1000 ppm and +3000 ppm | 100 | 100 |
| AAC 128 and 64 kbit/s, Opus 96 and 32, MP3 128 and 48 | 100 | 100 |
| AAC 128 kbit/s, then room 0.5 s, 0 dB, SNR 10 dB (video played on a laptop, phone across the desk) | 17 | 97 |
| 16, 32, 44.1 and 48 kHz, clean and at 3 dB | 100 | 100 |

What the simulation taught:

- Echo subtraction (step 6) and the longer `ROOM-1` symbol are what make rooms work. `NEAR-1` is twice as fast but needs the phone close to the speaker.
- An unguarded floor compensation costs about 1 dB in plain noise and causes errors in a clean channel. The guard and the lower quartile fix both.
- Known weak spots, good targets for later tuning: a strong steady tone that falls between two tone frequencies, very echoey halls, and speech as loud as the signal.

## 10. Suggested modules and order of work

`profiles.ts` → `gf256.ts` → `reed-solomon.ts` → `crc16.ts` → `whitening.ts` → `codeword.ts` → `mapping.ts` → `encoder.ts` → `tone-bank.ts` → `detector.ts` → `decider.ts` → `receiver.ts` → `wav.ts` → `index.ts`, README, benchmark.

Build and test the byte-level parts (GF, RS, CRC, whitening, mapping) completely before any audio code. Then the encoder. Then the receiver against the encoder's own output. Hardening against bad channels is done in M2 and M3 with the chamber, not here.

## 11. Notes for whoever implements this

- Reed-Solomon decoding (syndromes, Berlekamp-Massey, Chien search, Forney) is the easiest place to introduce a subtle bug. Property P4 with all 1 to 12 error counts is the safety net: do not move on until it passes at 500 runs.
- The receiver needs a ring buffer of samples and a rolling matrix of tone energies. Keep both pre-allocated.
- Two frames can follow each other after one symbol of silence. After a successful frame, continue the search from the end of that frame.
- Do not "improve" the format. If something in section 4 looks suboptimal, write it down in the summary and leave it.
