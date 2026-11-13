# Kiro write-up template (Kiroween 2026)

Fill this in yourself or run `/writeup-draft` in Kiro to get a first draft from the journal, then correct it. Every sentence must be true and traceable to the repository. Delete the guidance in italics before submitting. Aim for under 900 words.

---

## Dead Air: when the network dies, the radio screams

*Two sentences: what it is and who it is for.*

## What we built

*Three or four sentences. The Station, the Receiver, the relay. Name the two resurrected technologies (dial-up style tones, teletext pages) and what is new on top (signatures, fountain-coded carousel, any phone's browser as the decoder).*

## How Kiro was used

### Spec-driven development

*How many specs, in what order, and why that order. Requirements-first, from written briefs. Give real counts from `.kiro/specs/`: requirements, acceptance criteria, tasks. One example of Analyze Requirements (or your own review) catching a contradiction or gap before any code existed.*

### Property-based testing

*Why a modem and a wire protocol suit properties ("for any packet...", "for any subset of blocks..."). How many properties across the specs. **One concrete story:** the property, the shrunk counterexample fast-check reported, the bug it exposed, the fix. If no property ever failed, say that and say what you conclude from it.*

### MCP: giving the agent ears

*The problem (an agent cannot hear, so audio code is guesswork). The chamber MCP server and its five tools. What changed once the agent could measure: one before-and-after figure from `docs/tuning-log.md`, with preset and profile named.*

### Steering

*Which files are always on, which load by file pattern, which are slash commands, and why you split them that way. One instance where a steering rule visibly changed what the agent did (for example the frozen on-air format, or "never edit a pass mark").*

### Hooks

*Each hook in one line: trigger, action, what it saved you. Say which are shell commands (free) and which prompt the agent (cost credits), and why you chose each way.*

### Custom agents and permissions

*The signal engineer, the field editor, the accessibility auditor: what each may and may not touch. The point worth making: the tuning agent has no write permission on the pass marks, so it cannot move its own goalposts.*

### Powers

*What the power packages and who could reuse it. If you did not build it, say so.*

### IDE, CLI, Web and Crew

*One or two honest sentences for each surface you actually used: what you used it for and how it differed. For any surface you did not use, say "not used" rather than inventing a use.*

## What worked, what did not

*Two things Kiro did well on this project. Two things that were hard or went wrong, and what you did about them. Judges trust a write-up that includes the second half.*

## Results on real devices

*From `docs/field-tests.md`: devices, distances, profiles, time to receive the issue. Include the video-path test. State the limits: text only, slow, load once before going offline, radio rules vary by country.*

## What was prepared outside Kiro

*Be exact. For example: "The idea, the feature briefs in `docs/briefs/`, the starter steering, hook and agent files, and the chamber pass marks were drafted in a planning session with another AI assistant before development began. All specs, product code and tests were then produced in Kiro." Adjust to what really happened.*

## Try it

*Live URL. Two-device steps in three lines. One-device fallback (Simulate a broadcast, or Decode from a file). Where the WAV samples are.*
