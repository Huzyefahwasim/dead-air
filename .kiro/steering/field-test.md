---
inclusion: manual
---

# /field-test: guide a real-device test session

The chamber is a simulation. Before submission the modem must be proven with real speakers, real microphones and real air. Guide the user through the session below one step at a time, wait for their result after each step, and record everything in `docs/field-tests.md`. You cannot hear anything: ask the user for what they see on screen (pages received, time taken, signal meter reading) and write it down exactly.

## Setup to ask for

- Sender: a laptop with the deployed site open at `#/station`, the sample issue loaded.
- Receiver: at least one phone at `#/listen`. More phones and browsers are better (one Android Chrome, one iOS Safari at minimum).
- A quiet room first. Laptop volume at about 70 percent.

## Test matrix

Run each row with both profiles unless stated. For each run record: device and browser, distance, profile, pages received out of pages sent, seconds until the first page, seconds until the whole issue, verified or not, anything odd.

| # | Test | Pass mark |
|---|---|---|
| 1 | Digital loopback on one device ("Simulate broadcast" button) | Whole issue, verified |
| 2 | Phone held 10 to 20 cm from the laptop speaker, `NEAR-1` | Whole issue within 2 loops |
| 3 | Phone 1 m away, `NEAR-1` and `ROOM-1` | `ROOM-1`: whole issue within 2 loops |
| 4 | Phone 3 m away across the room, `ROOM-1` | Whole issue within 3 loops |
| 5 | Same as 3 with people talking or a TV on | `ROOM-1`: whole issue within 4 loops |
| 6 | Start listening halfway through a loop | Whole issue by the end of the next full loop |
| 7 | Relay: phone A (already has the issue) plays it to phone B, 20 cm apart | B shows the pages as verified by the original station |
| 8 | Tamper check: load the provided tampered WAV | No page from it is shown as verified |
| 9 | Unknown station: remove the station from trusted stations on the phone, listen again | Pages appear, clearly marked unverified |
| 10 | Offline: put the phone in airplane mode (Wi-Fi off), reload `#/listen`, listen | App loads and receives |
| 11 | Exported WAV played from a different device or a Bluetooth speaker | Whole issue |
| 12 | Through a real radio if one is available (any transmitter you are legally allowed to use), otherwise skip and say so | Whole issue |
| 13 | **Video path:** upload a 30 s unlisted test video containing the `ROOM-1` burst, play it on a laptop, receive on a phone | Hidden page received from the video |

## After the session

1. Summarise results in a table at the top of `docs/field-tests.md` with the date.
2. For every failure, write a one-line guess at the cause and whether the chamber has a preset that reproduces it. If not, propose a new preset definition (do not add it yourself; `chamber/presets.json` is the user's to change).
3. List the three most valuable fixes. Do not start them.

Row 13 matters most for the hackathon video. If it fails, say so plainly and first.
