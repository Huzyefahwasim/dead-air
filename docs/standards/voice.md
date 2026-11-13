# Voice: how everything in this project is written

This applies to every word a person will read or hear: the app's interface, the README, the Devpost page, the write up, the blog post, the video script, captions, commit messages and the video's description.

The rule in one line: **write it the way a thoughtful person would say it to a friend who is smart but busy, and never use dashes.**

## The rules

1. **Say the concrete thing first.** Lead with what it is or what happened. Name real things and give real numbers.
2. **Plain words.** If a simpler word works, use it. Explain a technical term the first time, in a few words, or do without it.
3. **One voice.** First person singular, the way one person speaks about their own work.
4. **No dashes of any kind as punctuation.** No em dash, no en dash, no hyphen standing in for either. When you feel the pull of one, the sentence wants to be two sentences, or it wants a comma.
5. **Avoid hyphenated compounds in prose.** Write "open source", "real time", "text to speech", "dial up modem", "two phones", "10 to 20 cm". If a compound truly reads wrong without its hyphen, reword the sentence.
6. **Short sentences, mixed with a few longer ones.** Read it aloud. If you run out of breath or it sounds like a brochure, rewrite it.
7. **Say the limits and the failures.** What it cannot do, what went wrong, what is still rough. This is what makes the rest believable.
8. **True, or it does not go in.** Every fact comes from the repository's record: the tests, the tuning log, the field tests, the journal. No invented stories, quotes, users, numbers or praise.
9. **Format lightly.** A heading only where a reader would look for one. No bold scattered inside sentences. No emoji as bullets or decoration. Lists only for things that really are lists.
10. **Stop when you are done.** No closing summary that repeats the paragraph. No "in conclusion".

## Where a hyphen is still correct

Rules 4 and 5 are about prose. They do not apply to things that are identifiers and would break or become wrong if changed:

* code, commands, flags, file and folder names, package names, addresses
* names defined by the project, such as `NEAR-1` and `ROOM-1`
* an official name that contains a hyphen
* Markdown markup itself. In public text, use `*` or numbers for lists so no stray hyphen shows in the raw text.

## Words and habits to cut

These make text sound like an advert. Cut them wherever they appear.

* Hype: revolutionary, seamless, cutting edge, powerful, robust, game changing, next generation, unlock, supercharge, leverage, empower, elevate
* Filler openers: "In today's world", "It's worth noting that", "Let's dive in", "Imagine a world where"
* Empty claims: "designed with users in mind", "built for scale", "a comprehensive solution"
* Reflex patterns: three adjectives in a row for rhythm, "not just X but Y", a rhetorical question as a hook, a colon followed by a dramatic reveal
* Self praise: anything that tells the reader how impressed to be

## Before and after

Before:

> Dead Air is a revolutionary solution that seamlessly bridges the digital divide, delivering critical information when it matters most.

After:

> Dead Air sends short pages of text as sound. A phone with no internet can read them off a radio or a loudspeaker, and can tell who sent them.

Before:

> Our robust, cutting edge modem leverages advanced signal processing to ensure reliable delivery.

After:

> The modem uses 64 tones and listens only for how loud each one is. That is why it still works through a cheap speaker or a compressed video.

Before:

> Challenges we ran into: we faced numerous challenges, but overcame them through perseverance.

After:

> The first modem worked next to the speaker and failed across the room. Echo from the previous tone was drowning the next one. Making each tone longer and subtracting the echo fixed it.

(Use the real story and the real numbers from `docs/tuning-log.md` and `docs/field-tests.md` when you write the real thing.)

## The spoken script is different from the page

For narration, write for the ear:

* Contractions are good: "it's", "can't", "you'll".
* Numbers the way a person says them: "more than three hundred", "about twenty bytes a second".
* One idea per sentence. Nothing a listener has to hold in their head while waiting for the verb.
* No parentheses, no lists, no abbreviations that have to be spelled out.
* Leave room to breathe. Silence over a good shot is better than more words.
