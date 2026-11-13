---
inclusion: fileMatch
fileMatchPattern: ["packages/modem/**", "packages/chamber/**", "packages/chamber-mcp/**", "chamber/**"]
---

# Modem and signal-processing rules

Full detail lives in `docs/briefs/01-acoustic-modem.md` and `docs/briefs/02-test-chamber.md`. This file is the short version to keep in mind on every edit.

## What the modem is

A multi-tone FSK modem in the audible band. 64 tones from 1000 Hz to 4150 Hz in 50 Hz steps, grouped into 16 sub-channels of 4 adjacent tones. In each symbol every sub-channel sounds exactly one of its 4 tones, so a symbol carries 32 bits (4 bytes). A frame is 4 preamble symbols plus 24 data symbols and carries one 96-byte Reed-Solomon codeword, which holds one 70-byte packet.

| Profile | Symbol | Tone on | Frame | Use |
|---|---|---|---|---|
| `NEAR-1` | 60 ms | 50 ms | 1.68 s | Phone held at the speaker, files, cables |
| `ROOM-1` | 120 ms | 110 ms | 3.36 s | Across a room with echo |

The receiver detects by **energy only**. It never uses phase. That is why the signal survives phone speakers, clipping, lossy codecs and clock drift.

## Frozen versus tunable

- **Frozen (on-air format):** tone plan, symbol timing, ramps, preamble patterns, byte-to-tone mapping, whitening sequence, RS(96,72), CRC-16. Two devices must agree on these forever. Do not change them without the user's explicit instruction and a new profile id.
- **Tunable (receiver internals):** analysis window length and placement, hop size, detection thresholds, floor compensation, echo subtraction, erasure flagging, any smarter decision logic. Improve these freely, **but only with chamber evidence** (see `/chamber-tune`).

## Coding rules

- Samples are `Float32Array`, mono, range -1 to 1. Functions take `sampleRate` explicitly. Supported rates are whole multiples of 100 Hz from 16 kHz up (16000, 32000, 44100, 48000, 96000). Durations are defined in milliseconds and converted with `Math.round(ms * sampleRate / 1000)`. Symbol period, tone-on time and analysis window are multiples of 10 ms, so they are whole numbers of samples at every supported rate. The 5 ms ramp and the 5 ms search hop are rounded to the nearest sample.
- Pure functions and small classes. No DOM, no Web Audio, no Node APIs, no globals, no `Math.random()`, no `Date.now()`.
- No allocation inside per-sample or per-hop loops in the receiver. Pre-allocate buffers in the constructor.
- The receiver is streaming: `push(chunk)` may be called with any chunk size, including 1 sample and chunks that cut a frame anywhere. Results must not depend on chunking.
- Tone energies are computed at the **exact** tone frequencies (Goertzel or a direct DFT bin), not by picking the nearest FFT bin.
- Accumulate in plain doubles. Convert to `Float32Array` only at the edges.

## Baseline receiver (known to work; improve from here)

1. **Tone-energy matrix.** Every 5 ms, take a 40 ms Hann-windowed slice and compute the energy at each of the 64 tone frequencies.
2. **Preamble search.** For each hop `h` and each profile, score = mean over the 4 preamble symbols and 16 sub-channels of `E[expected tone] / sum(E[4 tones of that sub-channel])`, reading rows `h, h+P, h+2P, h+3P` where `P` is hops per symbol. Random input scores about 0.25, a real preamble 0.65 to 1.0. Declare a candidate when the score is a local maximum, at least 0.6, and each of the 4 symbols alone scores at least 0.35. A candidate that then fails RS or CRC must not swallow audio: resume the search one hop later.
3. **Read 28 rows** starting at the detected position, at exact symbol spacing in samples (`start + n * symbolSamples`). Do not add up rounded hops: at 44.1 kHz that drifts by several milliseconds over a frame.
4. **Floor compensation (guarded).** Per tone, take the lower-quartile energy over the 28 rows as that tone's floor (not the median: by chance a tone can be active in half the symbols). A tone is "contaminated" only if its floor exceeds 4 times the median of all 64 floors **and** 2 percent of the typical active-tone energy. Divide contaminated tones by `floor / typicalFloor`. In a clean channel this step must change nothing.
5. **Echo subtraction.** Estimate `rho`, the fraction of a tone's energy still present one symbol later, from the known preamble (median over sub-channels, clamped to 0 to 0.9). Replace each row by `max(row - rho * previousRow, 0)`.
6. **Decide.** In each sub-channel pick the strongest of the 4 tones. Map to bytes, remove whitening, RS-decode, check CRC.

Measured in a pre-build simulation of this baseline: step 5 is what makes rooms work, and an unguarded step 4 costs about 1 dB in plain noise, which is why the guard exists.

## Definitions (use these exactly, so numbers are comparable)

- **In-band SNR (dB):** signal power is the mean square of the transmitted frame from its first to its last sample (gaps included). Noise power is the noise's power inside 1000 to 4200 Hz. White noise of variance `s2` at sample rate `fs` has in-band power `s2 * 3200 / (fs / 2)`.
- **Synthetic room:** impulse response = a unit direct impulse, plus Gaussian noise with an exponential envelope `exp(-6.91 * t / RT60)` starting 3 ms after the direct sound, scaled so that tail energy divided by direct energy equals `10^(-DRR/10)`.
- **Frame success rate:** frames whose packet is delivered correctly, divided by frames sent.

## Pitfalls already found

- Normalising every tone by its own median looks elegant and is wrong: it adds noise at low SNR and creates errors in a clean channel. Only compensate outliers, and estimate floors with the lower quartile.
- With a detection threshold of 0.5, about 1 in 12 frames of one profile triggered the other profile's detector in simulation. 0.6 plus the per-symbol minimum of 0.35 gave none, and missed no real preamble in any condition where the frame was still decodable.
- Whitening is mandatory. Without it, a payload of zeros makes one tone per sub-channel sound constantly, which looks like interference to step 4.
- `NEAR-1` and `ROOM-1` use different preamble patterns on purpose. Together with the 0.6 threshold, that keeps one profile's frames from triggering the other's detector.
- Packing 128 tones at 25 Hz spacing with an 80 ms window was tried in simulation. It produced byte errors even in a clean channel and was weaker than `ROOM-1` in rooms. Not worth pursuing.
