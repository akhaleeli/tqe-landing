import json
import os
import sys

from tools.daily.config import (PAGES_CSV, REVISED_CSV, RECITERS, EN_VOICES,
                                 COMMENTARY_VOICES, code)
from tools.daily import verses, audio, commentary

SURAH = {1: "al-Fātiḥa", 2: "al-Baqara"}
SURAH_AR = {1: "سُورَةُ ٱلْفَاتِحَة", 2: "سُورَةُ ٱلْبَقَرَة"}
OUT_DATA, OUT_AUDIO = "daily/data", "daily/audio"

# English display + audio overrides (override text is used for BOTH the on-screen
# translation and the generated audio; all 3 EN voices are generated via ElevenLabs).
EN_OVERRIDES = {
    "1:1": "In the Name of God, the Compassionate, the Merciful.",
    "1:3": "The Compassionate, the Merciful,",
    "2:1": "Alif – Lām – Mīm",
}

_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
         "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
         "sixteen", "seventeen", "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
         "eighty", "ninety"]


def words(n):
    if n < 20:
        return _ONES[n]
    t, o = divmod(n, 10)
    return _TENS[t] + (f"-{_ONES[o]}" if o else "")


def make_verse(ref, ar_text, en_text, display_ref=None):
    c = code(ref)
    override = ref in EN_OVERRIDES
    en_disp = EN_OVERRIDES.get(ref, en_text)

    ar_audio = {}
    for rk, folder in RECITERS.items():
        dest = f"{OUT_AUDIO}/{c}_ar_{rk}.mp3"
        if not os.path.exists(dest):
            audio.fetch(audio.reciter_url(folder, c), dest)
            audio.trim_silence(dest)
        ar_audio[rk] = {"audio": f"audio/{c}_ar_{rk}.mp3", "dur": round(audio.duration(dest), 3)}

    en_audio = {}
    for vk, voice in EN_VOICES.items():
        dest = f"{OUT_AUDIO}/{c}_en_{vk}.mp3"
        if not os.path.exists(dest):
            if override:
                commentary.generate(en_disp, dest, voice=COMMENTARY_VOICES[vk])
            elif voice is None:
                audio.copy_frank(c, dest)
                audio.trim_silence(dest)
            else:
                commentary.generate(en_text, dest, voice=voice)
        en_audio[vk] = {"audio": f"audio/{c}_en_{vk}.mp3", "dur": round(audio.duration(dest), 3)}

    return {"ref": display_ref or ref, "ar": ar_text, "en": en_disp,
            "ar_audio": ar_audio, "en_audio": en_audio}


def build(day, page):
    keys = verses.expand_page(PAGES_CSV, page)
    rows = verses.verse_rows(REVISED_CSV, keys)
    if not rows:
        raise RuntimeError(f"no verses found for page {page}")
    sura = rows[0]["sura"]
    first_aya, last_aya = rows[0]["aya"], rows[-1]["aya"]

    out_verses = [make_verse(r["ref"], r["ar"], r["en"]) for r in rows]
    # Open every day's recitation with the Basmala (1:1), unless the page already starts there.
    if rows[0]["ref"] != "1:1":
        b = verses.verse_rows(REVISED_CSV, ["1:1"])[0]
        out_verses.insert(0, make_verse("1:1", b["ar"], b["en"], display_ref="Bismillah"))

    intro_text = (f"Daily Qur'an. Day {words(day)}. {SURAH_AR[sura]}, "
                  f"verses {words(first_aya)} to {words(last_aya)}.")
    intro_audio = {}
    for vk, voice in COMMENTARY_VOICES.items():
        dest = f"{OUT_AUDIO}/day{day}_intro_{vk}.mp3"
        if not os.path.exists(dest):
            commentary.generate(intro_text, dest, voice=voice)
        intro_audio[vk] = {"audio": f"audio/day{day}_intro_{vk}.mp3",
                           "dur": round(audio.duration(dest), 3)}

    notes_src = json.load(open(f"content/daily/day{day}.notes.json", encoding="utf-8"))
    out_notes = []
    for i, n in enumerate(notes_src):
        naudio = {}
        for vk, voice in COMMENTARY_VOICES.items():
            dest = f"{OUT_AUDIO}/day{day}_note{i}_{vk}.mp3"
            if not os.path.exists(dest):
                commentary.generate(n["narration"], dest, voice=voice)
            naudio[vk] = {"audio": f"audio/day{day}_note{i}_{vk}.mp3",
                          "dur": round(audio.duration(dest), 3)}
        title = n["title"]
        if n.get("ref") is None:
            title = f"General remarks on {SURAH[sura]}"
        out_notes.append({"ref": n.get("ref"), "title": title, "text": n["display"],
                          "audio": naudio, "sources": n.get("sources", [])})

    data = {
        "day": day, "page": page, "surah": SURAH[sura],
        "range": [first_aya, last_aya],
        "intro": intro_audio, "verses": out_verses, "notes": out_notes,
    }
    os.makedirs(OUT_DATA, exist_ok=True)
    with open(f"{OUT_DATA}/day{day}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"wrote {OUT_DATA}/day{day}.json: {len(out_verses)} verses, {len(out_notes)} notes")


if __name__ == "__main__":
    build(int(sys.argv[1]), int(sys.argv[2]))  # day page
