# Brief 07: Night Desk, a Kiro Crew app (stretch goal)

- **Where:** a **separate public GitHub repository** under the same account as the main project, for example `dead-air-night-desk`. The hackathon's Best Kiro Crew App bonus asks for a separate repository whose GitHub account matches the main submission.
- **Depends on:** the main repository (as a checkout the app is pointed at), Kiro Crew installed locally
- **Milestone:** M8. Build this only after M7 is finished. It is a bonus, not part of the core product.

## 1. Purpose

A community station has no newsroom at 3 a.m. Night Desk is a small crew that keeps working when the operator is asleep:

1. **The Desk bot** watches public alert feeds for the station's area on a schedule and drafts Dead Air pages that fit the byte budget. It never publishes. In the morning the operator finds a draft issue waiting, opens it in the Station, checks each page and presses Publish themselves.
2. **The Night Shift bot** runs the test chamber overnight: parameter sweeps on the receiver, logged properly, with a short morning report of what improved, what did not, and what it recommends. It never merges its own changes.

The point for the hackathon write-up: this is work that only makes sense for an agent that persists across sessions, runs on a schedule, and remembers what it already tried.

## 2. Read the documentation first

Kiro Crew and its app format are new and change quickly. **Before writing any file, read:**

- https://kiro.dev/docs/crew/ (overview, quick start)
- https://kiro.dev/docs/crew/apps/ and https://kiro.dev/docs/crew/apps/build-first-app/
- https://kiro.dev/docs/crew/apps/manifest/ (every field of the app manifest)
- https://kiro.dev/docs/crew/features/ (scheduling, memory, Task Runner)

Follow the formats you find there, not anything remembered. If the documentation and this brief disagree about a file format, the documentation wins; if they disagree about behaviour, ask the user.

## 3. What the app contains

| Part | Content |
|---|---|
| Manifest | App identity, the two agents, the skills, the schedules, one dashboard page, and only the permissions it needs |
| Agent: desk | Prompt built on the field-editor rules from the main repository (limits, plain language, never invent facts, mark anything unconfirmed) |
| Agent: night-shift | Prompt built on the `/chamber-tune` procedure and its acceptance rule |
| Skill: draft-issue | Fetch alerts, select, condense into pages, validate against the page limits, write the draft file |
| Skill: overnight-sweep | Choose one receiver parameter, sweep it with the chamber, log results, write the morning report |
| Schedules | Desk: every 6 hours and on demand. Night Shift: once a night and on demand. Conservative on purpose: every run spends Kiro credits. |
| Dashboard page | Latest draft issue (pages, budget, source links, time drafted), last morning report, a "Run now" button for each bot, and a banner that says "Drafts only. Nothing is on air until you publish it in the Station." |

## 4. Requirements

**R1 Drafting**
1. WHEN the Desk bot runs, it SHALL fetch active alerts for the configured area from a public source that needs no key (default: the US National Weather Service API, `https://api.weather.gov/alerts/active?area=<state>`), and SHALL record the source URL and fetch time for every item it uses.
2. THE bot SHALL draft at most 6 pages, each within the page limits of the main project, and SHALL run the main repository's page-limit check on each before saving.
3. THE bot SHALL write `drafts/<date>-<time>.json` in the format the Station imports, with every page marked DRAFT and carrying its source.
4. THE bot SHALL NOT add facts, advice, phone numbers or place names that are not in the source text. Anything it is unsure of is marked `[CONFIRM: ...]`.
5. IF there are no active alerts, THEN THE bot SHALL write nothing and note "no alerts" in its log.
6. THE bot SHALL use its memory to avoid re-drafting an alert it has already drafted unless the alert was updated.

**R2 Human in the loop**
1. THE app SHALL have no ability to sign, publish or broadcast. It holds no station key.
2. Every surface that shows a draft SHALL say that it is a draft and that only the operator can publish.

**R3 Night shift**
1. WHEN the Night Shift bot runs, it SHALL pick one tunable receiver parameter it has not already swept (checked against its memory and `docs/tuning-log.md`), run a sweep with the chamber on a working copy of the main repository, and record the result in the tuning-log format.
2. THE bot SHALL NOT edit pass marks, presets or tests, and SHALL NOT commit to the main branch. A change that meets the acceptance rule is left on a branch named `night-shift/<date>-<parameter>` with the evidence in the commit message.
3. THE bot SHALL write `reports/<date>.md`: what was tried, a before and after table, a recommendation, and the credits or time used if Crew exposes them.

**R4 Cost control**
1. Schedules SHALL be off after installation until the user turns them on, and the README SHALL say that each run consumes Kiro credits.
2. Each run SHALL have a hard limit on steps or time, set in the manifest or the skill where the format allows.

**R5 Packaging**
1. THE repository SHALL be public, have an MIT license, and a README covering: what it does, installation into a local Crew, configuration (area code, path to the main repository), how to run each bot once, what it costs to run, and three screenshots or a short recording of the dashboard.
2. THE app SHALL install from a local path in a default Crew setup with third-party apps enabled.

## 5. Done when

- A manual "Run now" of the Desk bot produces a draft file the Station can import, with sources.
- A manual "Run now" of the Night Shift bot produces a report and, if it found an improvement, a branch.
- The dashboard shows both.
- The README lets someone else repeat this.

## 6. What to record for the write-up

How Crew differed from the IDE and the CLI in practice: what memory carried from one run to the next, what scheduling made possible, how long an unattended run took and what it used, and one thing that did not work.
