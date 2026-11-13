# Brief 06: Chamber MCP server and Kiro power

- **Spec name:** `chamber-mcp`
- **Package:** `packages/chamber-mcp` (`@deadair/chamber-mcp`), and later a `power/` folder
- **Depends on:** `@deadair/chamber`
- **Milestone:** M3 (part A), M8 (part B)

## 1. Purpose

Give Kiro ears. The chamber (Brief 02) can measure how well the modem works in a named acoustic condition, but as a command-line tool it returns walls of text, and an agent using it burns context and credits reading them. An MCP server exposes the same measurements as a few purposeful tools with small, structured answers, so an agent can run a real experimental loop: measure, diagnose, change one thing, measure again.

Part B packages that server, with the tuning know-how, as a Kiro power that any developer building a data-over-sound project can install.

## Part A: MCP server

### 2. Tools

Every tool returns a short text summary first, then a compact JSON block. No tool returns more than about 4 kB.

| Tool | Input | Returns |
|---|---|---|
| `list_presets` | none | Every preset with its description, stages, and pass marks per profile. |
| `run_trial` | `preset`, `profile`, optional `frames` (default 60, max 400), `seed` (default 1), `overrides` (partial stage parameters merged over the preset, for example `{ "noise": { "snrDb": 1 } }`) | Percentage delivered, pass mark and verdict, failure counts by classification, mean wrong bytes before correction, mean preamble score, mean `rho`. |
| `run_sweep` | `preset`, `profile`, `param` (for example `room.drrDb`), `values` (2 to 8 numbers), optional `frames`, `seeds` (1 to 3) | One row per value: percentage (mean over seeds) and mean wrong bytes. |
| `compare_to_baseline` | `mode`: `quick` or `full` | One row per preset and profile: percentage now, baseline, change in points, pass mark, verdict. Sorted worst margin first. Also writes `chamber/latest.json`. |
| `explain_failures` | `preset`, `profile`, optional `frames`, `seed` | Failure classification counts; the error map by data-symbol index (0 to 23) and by byte position within a symbol (0 to 3); distribution of preamble scores and `rho` for failed versus delivered frames; one sentence naming the dominant pattern (for example "errors concentrate in the first 4 data symbols"). |

### 3. Requirements

**R1 Server**
1. THE server SHALL speak MCP over stdio using `@modelcontextprotocol/sdk` and start with `node packages/chamber-mcp/dist/index.js` from the repository root.
2. THE server SHALL call the chamber library directly (no child process for its own package) and SHALL be ready within 2 seconds.
3. THE server SHALL write nothing to stdout except protocol messages. Diagnostics go to stderr.

**R2 Tools**
1. THE server SHALL provide exactly the five tools in section 2, each with a JSON schema, a one-line description that says when to use it, and input validation.
2. IF an input is invalid (unknown preset or profile, `frames` out of range, unknown stage or parameter in `overrides` or `param`), THEN THE tool SHALL return an MCP error result that names the bad field and lists the valid values. It SHALL NOT crash.
3. Tool output SHALL be deterministic for the same input and code.
4. No tool SHALL modify `chamber/presets.json`, `chamber/thresholds.json` or `chamber/baseline.json`.

**R3 Economy**
1. Every tool result SHALL be at most 4000 characters. Longer tables are truncated to the worst rows with a note saying how many were omitted.
2. A `run_trial` with default arguments on a 16 kHz preset SHALL finish in under 20 seconds.

**R4 Wiring into Kiro** (do these as the last tasks of the spec)
1. Set `"disabled": false` for `deadair-chamber` in `.kiro/settings/mcp.json`. If Kiro cannot start the server with the relative path, document the fix in the package README.
2. Add `"@deadair-chamber"` to `tools` in `.kiro/agents/signal-engineer.json`, and add a permission rule `{ "capability": "mcp", "match": ["deadair-chamber/*"], "effect": "allow" }`.
3. Add an "MCP tools" section to `packages/chamber-mcp/README.md` with one worked example per tool.

### 4. Correctness properties

| Id | Property | Validates |
|---|---|---|
| P1 | **Same numbers as the library.** For any valid arguments, the figures in a tool's JSON block equal what the chamber library returns for the same call. | R1.2, R2.3 |
| P2 | **Bad input is an answer, not a crash.** For any JSON value passed as arguments to any tool, the server returns either a valid result or an MCP error result, and stays alive. | R2.2 |
| P3 | **Size bound.** For any valid arguments, the result text is at most 4000 characters. | R3.1 |
| P4 | **Read-only.** For any sequence of tool calls, the three protected files are byte-identical before and after. | R2.4 |

### 5. Order of work

Schemas and validation → `list_presets` → `run_trial` → `run_sweep` → `compare_to_baseline` → `explain_failures` → stdio entry point and build → properties → the wiring in R4.

When part A is done, open a chat with the `signal-engineer` agent and run `/chamber-tune`. That session is the first real use of the tools and belongs in the journal.

## Part B: Kiro power (milestone M8)

### 6. What to build

A power in the folder `power/` of this repository that lets another developer, working on any data-over-sound or audio-modem project, give their Kiro agent the same abilities.

**Before writing any file, read the current format in Kiro's documentation** at https://kiro.dev/docs/powers/create/ and https://kiro.dev/docs/powers/installation/ and follow it exactly. Do not write the manifest from memory: the format has changed over time.

Contents:

- The power's manifest and MCP configuration, pointing at this repository's chamber MCP server. Activation keywords should match how developers describe the task: acoustic modem, data over sound, audio FSK, tone decoder, test audio codec robustness, speaker to microphone.
- Two skills:
  - **tune-acoustic-receiver:** the measure, diagnose, hypothesise, test, decide loop from `/chamber-tune`, written for any modem, with the acceptance rule (target up at least 3 points, nothing else down more than 1).
  - **design-channel-preset:** how to turn a real-world failure ("works at my desk, fails in the kitchen") into a preset: which stage models which physical effect, typical values for RT60, direct-to-reverberant ratio and SNR in homes, cars and halls, and how to validate a preset against a field recording.
- A reference note with the lessons recorded in `docs/tuning-log.md` and in `.kiro/steering/modem-dsp.md` under "Pitfalls already found".
- A README: what it is, how to install it from a local path and from GitHub, a 5-minute walkthrough.

### 7. Requirements

1. THE power SHALL install in Kiro from the local `power/` folder using the Powers panel, and its MCP tools SHALL appear after installation.
2. THE power's skills SHALL contain no Dead Air specific constants: they refer to "your modem" and to the chamber's presets by role.
3. THE power's README SHALL state plainly that the simulator approximates rooms and devices and does not replace tests on real hardware.
4. THE repository README SHALL link to the power and say how to install it.

### 8. Done when

A fresh Kiro workspace with only the power installed can answer "run the living-room preset on ROOM-1 and tell me where the errors are" by calling the tools.
