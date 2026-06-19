# Commentary Narration — Scripting Style Guide

Conventions for writing commentary text that will be narrated by **ElevenLabs (v3 model)**
for the Quraniverse "daily page" audio. Following these yields the most accurate,
natural-sounding TTS output. This guide governs the *narration script* (the text fed to
TTS), not necessarily the on-screen display text.

## Conventions

1. **Arabic terms in Arabic script.** Write any Arabic term, word, or name in Arabic
   script — not transliteration. v3 pronounces Arabic script correctly, whereas
   transliteration is anglicised or mispronounced.
   - ✅ `التَّقْوَىٰ`, `ٱللَّه`, `ٱلصَّلَاة`, `ٱلزَّكَاة`
   - ❌ `taqwa`, `salah`, `zakah`, `Allah`
   - The on-screen *display* text may still show an English gloss/transliteration; this
     rule applies to the narration script only.

2. **Numbers as words.** Spell out all numbers in the narration script.
   - ✅ "verse twelve", "the first of three", "fourteen hundred years"
   - ❌ "verse 12", "1 of 3", "1400 years"

## Notes

- **Model:** ElevenLabs **v3** for commentary narration.
- **Verse translation audio** uses the existing "Frank" voice set (already generated for
  the whole Qur'an); commentary uses a separate British male voice (TBD — auditioning).
- Add further conventions here as they arise (pauses/emphasis, honorifics after names,
  handling of footnote markers, etc.).
