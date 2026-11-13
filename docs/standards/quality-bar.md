# Quality bar: friendly to use, and clearly made on purpose

The interface must be easy for anyone to use, and nothing in this project may look generic or unfinished.

Careless work has a recognisable look: generic choices nobody made, decoration with no job, text that says nothing, and details that do not line up. The cure is the same every time: decide, be specific, and check the small things.

## 1. The interface

### Easy to use

* The first screen says what this is and what to do next, in one sentence each.
* One main action per screen, and it is the biggest thing on it.
* Every press gets a visible response at once. Anything that takes time shows that it is working.
* Every state is designed: nothing received yet, listening, receiving, done, something went wrong, microphone refused, offline.
* An error says what happened and what to do now, in plain words. No codes, no blame.
* There is always a way to stop and a way back. Nothing destructive happens without a clear confirmation.
* The words on screen are the words a person would use. No "preamble", "frame", "packet" or "ESI" on the Receiver.
* It works with one hand on a small phone, with a keyboard alone, and with a screen reader.
* The same thing has the same name everywhere.

### Clearly made on purpose

* One visual idea, the teletext screen, carried through every screen. Nothing borrowed from a template.
* None of these, ever: purple or rainbow gradients, glass blur panels, glowing blobs, floating shapes, stock illustrations, generated images, emoji as icons, a hero slogan with two buttons, three feature cards in a row, fake testimonials, fake logos, placeholder text.
* Real content everywhere. Sample pages read like bulletins a real station would send, with fictional place names.
* Things line up. One spacing scale, one type scale, consistent capitalisation, consistent button sizes.
* Colour means something and never carries meaning alone.
* The browser tab has a proper title and icon. There are no console errors, no broken links and no dead buttons.
* Motion is rare and has a reason. It all stops when the user has asked for reduced motion.

## 2. The README and other documents

* Opens with what the project is in two sentences, then how to try it.
* Commands are exact and have been run from a fresh clone.
* Real screenshots of the real app. No mock ups.
* A limits section that a critic would agree with.
* No wall of badges, no emoji headings, no feature list that could describe any project, no table of contents for a short file.
* Short. If a section does not help someone use, run or judge the project, it goes.

## 3. The video

* The product is on screen, working, within the first 15 seconds.
* Real devices, filmed steadily, in focus, with the screen readable.
* No stock footage, no generated images or avatars, no slides full of text, no background music.
* Captions are burned in, large enough to read on a phone, and match the words spoken.
* One idea per shot. Cuts on the beat of the sentence.
* The voice sounds like a person explaining, not an advert. Calm pace. Pauses kept.
* No brand names or logos in frame other than the project's own and Kiro where it is being shown.
* Under 2 minutes 55 seconds.

## 4. The repository

* History reads like a story: clear messages, one concern per commit.
* No junk: no stray archives, editor files, logs, generated folders or large binaries.
* No blocks of commented out code, no abandoned experiments, no list of unfinished notes.
* File and folder names follow one convention.
* The license file is correct and carries the owner's name.
* Every third party asset has its license in the repository and is credited.

## 5. A quick review checklist

Answer each with Pass or Fail and one line of evidence.

1. A stranger can tell what this is and what to press within 10 seconds of opening it.
2. A stranger can receive a page using only what the screen tells them.
3. Every state listed above exists and reads well.
4. Nothing on any screen comes from the "none of these" list.
5. All text follows `docs/standards/voice.md`.
6. At 320 px wide nothing overflows or overlaps.
7. Keyboard only: every action reachable, focus always visible.
8. An unverified page cannot be mistaken for a verified one.
9. The README lets someone run the project from a fresh clone without asking a question.
10. The video shows the real thing working and would make sense with the sound off.
