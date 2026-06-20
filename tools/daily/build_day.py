import json
import os
import re
import sys

from tools.daily.config import PAGES_CSV, REVISED_CSV
from tools.daily import verses, audio

SURAH = {1: "al-Fātiḥa", 2: "al-Baqara"}
OUT_DATA, OUT_AUDIO = "daily/data", "daily/audio"


def display_block(md):
    t = open(md, encoding="utf-8").read()
    title = re.search(r"\*\*(On .+?)\*\*", t).group(1)
    body = re.search(r"##\s*DISPLAY\s*\n(.+?)\n##", t, re.S).group(1).strip()
    return title, body


def build(day, page):
    keys = verses.expand_page(PAGES_CSV, page)
    rows = verses.verse_rows(REVISED_CSV, keys)
    if not rows:
        raise RuntimeError(f"no verses found for page {page}")
    out_verses = []
    for r in rows:
        c = r["code"]
        ar_dest, en_dest = f"{OUT_AUDIO}/{c}_ar.mp3", f"{OUT_AUDIO}/{c}_en.mp3"
        audio.fetch(audio.husary_url(c), ar_dest)
        audio.trim_silence(ar_dest)
        audio.copy_frank(c, en_dest)
        audio.trim_silence(en_dest)
        out_verses.append({
            "ref": r["ref"], "ar": r["ar"], "en": r["en"],
            "ar_audio": f"audio/{c}_ar.mp3", "en_audio": f"audio/{c}_en.mp3",
        })
    title, text = display_block(f"content/daily/day{day}.commentary.md")
    data = {
        "day": day, "page": page, "surah": SURAH[rows[0]["sura"]],
        "verses": out_verses,
        "commentary": {"title": title, "text": text,
                       "audio": f"audio/day{day}_commentary.mp3"},
    }
    os.makedirs(OUT_DATA, exist_ok=True)
    with open(f"{OUT_DATA}/day{day}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"wrote {OUT_DATA}/day{day}.json with {len(out_verses)} verses")


if __name__ == "__main__":
    build(int(sys.argv[1]), int(sys.argv[2]))  # day page
