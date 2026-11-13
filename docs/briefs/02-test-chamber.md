# Brief 02: Test chamber

- **Spec name:** `test-chamber`
- **Package:** `packages/chamber` (`@deadair/chamber`), plus the data files in `/chamber`
- **Depends on:** `@deadair/modem` (and, for phase 2, `@deadair/protocol`)
- **Milestone:** M2

## 1. Purpose

A coding agent cannot hear. Without measurements it guesses at signal-processing code, and guesses about audio are usually wrong in ways that only show up on a real phone. The chamber is a deterministic simulator of bad acoustic conditions that turns "does the modem work?" into numbers: for a named condition, what percentage of frames get through.

It is used four ways: as a command-line tool, as the gate in `npm run chamber:quick`, as the engine behind the MCP server (Brief 06), and by the `/chamber-tune` procedure.

## 2. Scope

**In scope:** channel stages, presets, trial runner, failure diagnostics, JSON reports, pass marks, baseline comparison, CLI.

**Out of scope:** the MCP wrapper (Brief 06), any change to the modem, real audio devices.

**Files that already exist and belong to the user:** `chamber/presets.json` and `chamber/thresholds.json`. Read them, validate them, never rewrite them.

## 3. Channel stages

A channel is an ordered pipeline. Every stage is optional. Stages are always applied in this order:

```
frame -> [codec] -> [room] -> [band] -> [+tone] -> [+speech] -> [+noise] -> [clip] -> [clock] -> receiver
```

Let `Psig` be the mean square of the encoded frame from its first to its last sample, measured before any stage.

| Stage | Parameters | Exact definition |
|---|---|---|
| `codec` | `name`: `aac`, `opus` or `mp3`; `kbps` | Write the buffer as 16-bit WAV, encode and decode it with the `ffmpeg` binary found on `PATH`, resample back to the trial's sample rate, mono. If `ffmpeg` is not installed the preset is reported as `skipped`, never as failed. |
| `room` | `rt60` (s), `drrDb` | Convolve with an impulse response made of a unit impulse at time 0 plus a tail: Gaussian noise times `exp(-6.91 * t / rt60)`, zero for the first 3 ms, lasting `1.5 * rt60`, scaled so `sum(tail^2) = 10^(-drrDb / 10)`. Output is truncated to the input length. |
| `band` | `lowHz`, `highHz` | 4th-order Butterworth band-pass. |
| `tone` | `hz`, `relAmplitude` | Add a sinusoid over the whole buffer with amplitude `relAmplitude * sqrt(2 * Psig / 16)`. |
| `speech` | `sirDb` | Add synthetic speech-like interference (below), scaled so its mean square over the whole buffer is `Psig / 10^(sirDb / 10)`. |
| `noise` | `snrDb` | Add white Gaussian noise with variance `Psig / 10^(snrDb / 10) * (sampleRate / 2) / 3200`, which makes the in-band (1000 to 4200 Hz) SNR equal `snrDb`. |
| `clip` | `gain` | Multiply by `gain`, then clamp to -1..1. |
| `clock` | `ppm` | Resample by linear interpolation, reading the input at steps of `1 + ppm * 1e-6` samples. |

**Speech-like interference.** A sequence of bursts covering the buffer. Each burst: duration uniform in 80 to 250 ms; white noise through a 2nd-order Butterworth band-pass with centre uniform in 600 to 3500 Hz and bandwidth uniform in 200 to 600 Hz; shaped by a Hann window. The next burst starts 0.6 to 1.2 burst-lengths after the previous one started. No recorded speech is used anywhere.

All randomness comes from one seeded generator per trial. The same seed and inputs always give the same output samples.

## 4. Trials

**Signal trial** (one frame):
1. Draw a random 70-byte packet from the seeded generator. Encode it with the chosen profile at the preset's sample rate (default 16000 Hz, which is 3x faster to simulate than 48000 and gave identical results in the design simulation).
2. Put 150 to 450 ms of silence before the frame and 450 ms after it.
3. Run the channel.
4. Feed the result to a fresh receiver in chunks of random sizes between 1 and 4096 samples.
5. **Success** means exactly one `frame` event whose packet equals the one sent. Anything else is a failure, classified as: `no-candidate`, `rs-failed`, `crc-failed`, `wrong-packet`, `extra-frames`.
6. Record: success, classification, preamble score, `rho`, SNR estimate, corrected bytes, and, by comparing the event's raw codeword with the one sent, the number and positions of wrong bytes before error correction.

**No-signal trial:** a buffer with no frame in it, of a given length in seconds, pushed to a receiver with both profiles enabled. The result is the count of `frame` events, which must be 0. Three sources:

- `noise`: white Gaussian noise at RMS 0.1.
- `speech`: the speech-like interference above, scaled to RMS 0.1.
- `tones`: six sinusoids at 1047, 1319, 1568, 2093, 2637 and 3136 Hz, amplitude 0.05 each, each switched on and off by a square wave at its own rate between 0.7 and 2 Hz, plus white noise at RMS 0.005.

**Phase 2, after the page protocol exists: issue trial.** Broadcast a whole sample issue on the carousel through a channel, with a given fraction of frames deleted at random, starting at a random point in the loop. Record seconds until the first verified page and until the whole issue is verified.

## 5. Requirements

**R1 Stages**
1. THE chamber SHALL implement each stage exactly as defined in section 3, in the fixed order.
2. THE chamber SHALL be deterministic: the same preset, profile, frame count and seed produce an identical report apart from timing fields.
3. WHERE `ffmpeg` is not available, THE chamber SHALL mark codec presets as `skipped` and SHALL NOT count them as failures.

**R2 Presets and pass marks**
1. THE chamber SHALL load presets from `chamber/presets.json` and pass marks from `chamber/thresholds.json`, and SHALL report a clear error naming the file and field if either is malformed.
2. THE chamber SHALL NOT write to either file.
3. WHEN a preset's pass mark for a profile is `null`, THE chamber SHALL report the result and SHALL NOT fail on it.

**R3 Running**
1. `runTrial`, `runPreset(presetId, profileId, frames, seed)` and `runMatrix(mode)` SHALL be exported for programmatic use (the MCP server calls them).
2. `quick` mode SHALL run the presets listed under `quick` in `thresholds.json` with the `quick` frame count, and `full` mode every preset with the `full` frame count.
3. `quick` mode SHALL finish in under 90 seconds on a laptop.

**R4 Diagnostics**
1. For every preset and profile THE report SHALL include: frames sent, frames delivered, percentage, failure counts by classification, mean and 95th percentile of wrong bytes before correction, mean preamble score, mean `rho`.
2. THE report SHALL include an error map per preset and profile: wrong-byte counts by sub-channel group (the 4 byte positions in a symbol) and by data symbol index (0 to 23), so that "errors cluster at the start of the frame" or "one sub-channel group is bad" is visible.

**R5 Reports and baseline**
1. THE chamber SHALL write the latest report to `chamber/latest.json` and print a compact table (one line per preset and profile: percentage, pass mark, PASS, FAIL, INFO or SKIP).
2. WHEN `chamber/baseline.json` exists, THE table SHALL show the change in percentage points against it.
3. THE chamber SHALL overwrite `chamber/baseline.json` only when run with `--accept`.
4. THE process SHALL exit with code 1 if any result is below its pass mark or any no-signal trial decodes a frame, and 0 otherwise.

**R6 CLI**
1. `npm run chamber -- --preset <id> --profile <id> [--frames n] [--seed n] [--sample-rate n]` SHALL run one preset.
2. `npm run chamber -- --sweep <stage.param>=<a,b,c> --preset <id> --profile <id>` SHALL run the preset once per value and print one line per value.
3. `npm run chamber:quick` and `npm run chamber:full` SHALL run the matrix modes. `--accept` and `--json` (print the report to stdout, nothing else) SHALL be supported.
4. `npm run chamber -- --wav-out <dir>` SHALL save the degraded audio of the first 3 failed trials as WAV files, for listening.

## 6. Correctness properties

| Id | Property | Validates |
|---|---|---|
| P1 | **Determinism.** For any preset, profile and seed, two runs give equal reports (ignoring timing fields). | R1.2 |
| P2 | **Empty channel is the identity.** For any buffer, a channel with no stages returns it unchanged. | R1.1 |
| P3 | **Noise level.** For any `snrDb` from -5 to 30 and any seed, the measured in-band SNR of the noise stage on a 10-second signal is within 0.3 dB of `snrDb`. | R1.1 |
| P4 | **Room energy.** For any `rt60` from 0.1 to 1.5 and `drrDb` from -10 to 20, the generated impulse response has tail-to-direct energy within 0.1 dB of `-drrDb`. | R1.1 |
| P5 | **Clip bound.** For any buffer and gain, every output sample of the clip stage is within -1 to 1. | R1.1 |
| P6 | **Clock length.** For any buffer of length `n` and `ppm` from -5000 to 5000, the output length is within 1 sample of `n / (1 + ppm * 1e-6)`. | R1.1 |
| P7 | **Pass-mark logic.** For any report and thresholds, the verdict is FAIL exactly when a non-null mark is above the measured percentage or a no-signal count exceeds its limit. | R2.3, R5.4 |
| P8 | **Clean preset.** For any seed, the `clean` preset delivers 100 percent on both profiles. | R3 |

## 7. What the pass marks are based on

`chamber/thresholds.json` was set from the design simulation in Brief 01, section 9, with a safety margin below the simulated figure. For example `living-room` on `ROOM-1` simulated at 96 percent and has a pass mark of 88. Presets with a `null` mark are known weak spots that are reported for information.

If your implementation lands below a pass mark, the modem has a bug or is weaker than the baseline design. The fix is in the modem. Do not touch the marks.

## 8. Suggested modules and order of work

`prng.ts` (seeded generator, Gaussian) → `dsp.ts` (biquad filters, convolution, resampling) → `stages/*.ts` one per stage → `channel.ts` → `trial.ts` → `config.ts` (load and validate the two JSON files) → `report.ts` → `matrix.ts` → `cli.ts`. Codec stage last (it needs `child_process` and temp files; keep all Node-specific code in `stages/codec.ts` and `cli.ts`).

Finish by running `npm run chamber:full` and showing the table. Any FAIL at this point is a modem problem to hand to the signal engineer, not something to hide.
