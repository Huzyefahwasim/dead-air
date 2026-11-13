---
inclusion: always
---

# Product: Dead Air

**One line:** Dead Air broadcasts short, signed text pages as sound, so a phone with no internet can read them off any radio or loudspeaker.

**Tagline:** When the network dies, the radio screams.

**Hackathon framing (Kiroween 2026, category: Resurrection):** it resurrects two dead technologies, the dial up modem (data as audible tones) and teletext (numbered pages on a looping carousel), to solve a current problem: getting trustworthy information to people during internet shutdowns and disasters.

## Who it is for

| Person | Situation | What they need |
|---|---|---|
| **Station operator** | Runs a community radio station, a PA system, or just a laptop and a speaker | Compose a few short pages, sign them, put them on air on a loop |
| **Listener** | Has a phone but no connectivity; can hear the broadcast | Tap Listen, hold the phone up, read pages, know who sent them |
| **Relayer** | A listener who already has the pages | Play them onward from their own phone to the next person |
| **Deaf or hard of hearing listener** | Voice radio is useless to them | Text on screen plus a vibration when a verified page arrives |

## The product in three parts

1. **Station** (`#/station`): write or import pages, see the byte and airtime budget live, sign the issue, broadcast it on a loop, export it as a WAV file.
2. **Receiver** (`#/listen`): works offline. Listens through the microphone, shows pages on a teletext style screen as they arrive, shows whether the sender is verified, stores them, reads them aloud.
3. **Relay**: any receiver can broadcast again what it holds. The original signature travels with it, so a relay cannot alter the content unnoticed.

## Promises we must keep

- **Works with no network.** After first load, the Receiver never needs a connection.
- **No server.** Everything runs in the browser. There is no backend and no paid API in the core flow.
- **Honest trust signals.** A page is shown as *Verified* only when a valid signature from a station the user trusts covers that exact content. Otherwise it is clearly marked *Unverified*.
- **Robust before fast.** A slow page that arrives beats a fast page that does not.
- **Plain language.** Pages and interface copy are short and readable by a stressed person on a small screen.

## Vocabulary (use these words consistently)

- **Page**: one screen of text with a number (100 to 899), a title and up to 15 body lines.
- **Issue**: the set of pages a station publishes together, with one signature.
- **Manifest**: the small signed record that lists every page in an issue and its hash.
- **Carousel**: the endless loop in which an issue is broadcast.
- **Packet**: 70 bytes of protocol data. **Frame**: one packet encoded as a burst of tones.
- **Profile**: a modem timing mode. `NEAR-1` is fast and for a phone held at the speaker; `ROOM-1` is half the speed and survives room echo.
- **Station key**: the Ed25519 key pair that signs issues. **Trusted stations**: the public keys a receiver accepts.

## Out of scope

Two way links, images, audio or files over the air, user accounts, analytics, payments, ultrasonic or inaudible modes, native apps.

## Limits to state openly (never hide these in copy or docs)

- Text only, tens of bytes per second.
- The Receiver must be loaded once while online before it can be used offline.
- Rules about data tones on licensed radio bands differ by country; a loudspeaker avoids the question.
- Key storage in a browser is good enough for a demonstration, not a hardened key store.
