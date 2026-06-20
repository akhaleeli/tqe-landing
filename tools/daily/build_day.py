import json
import os
import sys

from tools.daily.config import PAGES_CSV, REVISED_CSV
from tools.daily import verses, audio, commentary

SURAH = {1: "al-Fātiḥa", 2: "al-Baqara"}
SURAH_AR = {1: "سُورَةُ ٱلْفَاتِحَة", 2: "سُورَةُ ٱلْبَقَرَة"}
OUT_DATA, OUT_AUDIO = "daily/data", "daily/audio"

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


def build(day, page):
    keys = verses.expand_page(PAGES_CSV, page)
    rows = verses.verse_rows(REVISED_CSV, keys)
    if not rows:
        raise RuntimeError(f"no verses found for page {page}")
    sura = rows[0]["sura"]
    first_aya, last_aya = rows[0]["aya"], rows[-1]["aya"]

    out_verses = []
    for r in rows:
        c = r["code"]
        ar_dest, en_dest = f"{OUT_AUDIO}/{c}_ar.mp3", f"{OUT_AUDIO}/{c}_en.mp3"
        if not os.path.exists(ar_dest):
            audio.fetch(audio.husary_url(c), ar_dest)
            audio.trim_silence(ar_dest)
        if not os.path.exists(en_dest):
            audio.copy_frank(c, en_dest)
            audio.trim_silence(en_dest)
        out_verses.append({
            "ref": r["ref"], "ar": r["ar"], "en": r["en"],
            "ar_audio": f"audio/{c}_ar.mp3", "en_audio": f"audio/{c}_en.mp3",
            "ar_dur": round(audio.duration(ar_dest), 3),
            "en_dur": round(audio.duration(en_dest), 3),
        })

    # Intro (played only on "Play page")
    intro_dest = f"{OUT_AUDIO}/day{day}_intro.mp3"
    intro_text = (f"Daily Qur'an. Day {words(day)}. {SURAH_AR[sura]}, "
                  f"verses {words(first_aya)} to {words(last_aya)}.")
    if not os.path.exists(intro_dest):
        commentary.generate(intro_text, intro_dest)

    notes_src = json.load(open(f"content/daily/day{day}.notes.json", encoding="utf-8"))
    out_notes = []
    for i, n in enumerate(notes_src):
        ndest = f"{OUT_AUDIO}/day{day}_note{i}.mp3"
        if not os.path.exists(ndest):
            commentary.generate(n["narration"], ndest)
        title = n["title"]
        if n.get("ref") is None:
            title = f"General remarks on {SURAH[sura]}"
        out_notes.append({
            "ref": n.get("ref"), "title": title, "text": n["display"],
            "audio": f"audio/day{day}_note{i}.mp3",
            "dur": round(audio.duration(ndest), 3),
            "sources": n.get("sources", []),
        })

    data = {
        "day": day, "page": page, "surah": SURAH[sura],
        "intro": {"audio": f"audio/day{day}_intro.mp3",
                  "dur": round(audio.duration(intro_dest), 3)},
        "verses": out_verses, "notes": out_notes,
    }
    os.makedirs(OUT_DATA, exist_ok=True)
    with open(f"{OUT_DATA}/day{day}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"wrote {OUT_DATA}/day{day}.json: {len(out_verses)} verses, "
          f"{len(out_notes)} notes, intro {data['intro']['dur']}s")


if __name__ == "__main__":
    build(int(sys.argv[1]), int(sys.argv[2]))  # day page
