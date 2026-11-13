---
inclusion: manual
---

# /chamber-tune: improve the receiver with evidence

Run this procedure when asked to tune or harden the modem. It is deliberately strict: every change to the receiver must be justified by chamber numbers.

## Ground rules

- You may change **receiver internals only** (see "Frozen versus tunable" in `modem-dsp.md`). Never the on-air format.
- You may not edit `chamber/thresholds.json`, `chamber/presets.json`, or any test's expected value.
- One hypothesis per experiment. One experiment changes one thing.
- At most **3 experiments per invocation**, then stop and report. This keeps cost bounded.

## Procedure

1. **Measure.** If the `deadair-chamber` MCP tools are available, call `compare_to_baseline`; otherwise run `npm run chamber:full` and read `chamber/latest.json`. Do not paste the raw JSON into the chat.
2. **Rank.** List the presets below threshold, then the three passing presets with the smallest margin. Pick the single worst one as the target.
3. **Diagnose before changing anything.** For the target preset, look at the failure breakdown the chamber reports (missed preambles, frames with too many byte errors, CRC failures, which sub-channels and which symbols carry the errors). State in one sentence what you think is going wrong.
4. **Hypothesise.** Propose one change and say what result would prove you wrong. Examples of legitimate changes: window placement inside the symbol, window length, detection threshold, the outlier factor in floor compensation, the clamp on `rho`, per-symbol-pair echo estimates, flagging low-confidence bytes as erasures for the RS decoder.
5. **Test narrowly.** Run the target preset with at least 100 frames and 3 different seeds, before and after.
6. **Test for regressions.** Run `npm run chamber:quick`. Then run `npm test`.
7. **Decide.** Keep the change only if all of these hold:
   - the target preset improves by at least 3 percentage points averaged over the seeds;
   - no must-pass preset drops by more than 1 point;
   - the plain-noise preset at 3 dB does not get worse;
   - `npm test` passes, including the clean-channel no-op property.
   Otherwise revert the change completely.
8. **Record.** Append to `docs/tuning-log.md`:

```markdown
## <date> <short name of experiment>
- Target preset and profile:
- Diagnosis:
- Hypothesis:
- Change (file and one-line description):
- Result: | preset | profile | before | after |
- Decision: kept / reverted, and why
```

9. **Report.** After the last experiment, give a table of before and after for every must-pass preset, say what you kept, and name the next most promising idea without doing it.

## When everything already passes

Do not tune for its own sake. Say so, list the three smallest margins, and stop.
