# Phase 2 POC — "Daily Qur'an" Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an interactive `/daily` preview of Phase 2 — three "days" (mushaf pages 1–3) with a sequenced Arabic-recitation → English-translation → commentary player, verse highlighting, and a real email capture — linked from the landing page's Phase 2 card.

**Architecture:** Build-time Python scripts assemble per-day JSON + trimmed audio from existing assets (Frank EN audio, Husary recitation, ElevenLabs commentary); a static page (`daily/`) renders it with a vanilla-JS segment player; a Cloudflare Worker + KV captures emails. Vertical slice first: Day 1 end-to-end before generalising.

**Tech Stack:** Python 3 + pytest + ffmpeg (build), vanilla HTML/CSS/JS (frontend), Cloudflare Pages + Worker + KV (hosting), Playwright (frontend verification).

## Global Constraints

- Repo: `tqe-landing` (github.com/akhaleeli/tqe-landing). Commit + push as work completes; deploy is auto via GitHub Actions on push to `main`.
- Vendor-neutral, reverent UI copy. Match the landing palette: `--navy #0E2748`, `--brass #C9A24A`, `--cream #FBF7EE`; fonts EB Garamond (display), Inter (body), Scheherazade New (Arabic).
- **Secrets never committed.** ElevenLabs key read at build time from `~/.keys/elevenlabs.env` (`ELEVENLABS_API_KEY`). The CI `CLOUDFLARE_API_TOKEN` secret already exists.
- ElevenLabs model: `eleven_v3`. Commentary voice: **Steve** `HJlUPggR4CCkl0gC427J`. Verse-translation voice (existing audio): **Frank** `a1TnjruAs5jTzdrjL8Vd`.
- Narration scripts follow `docs/commentary-narration-style.md` (Arabic terms in Arabic script; numbers as words).
- Audio fragments must be silence-trimmed; player inserts a small configurable inter-fragment gap (default 200 ms).

### Source data (verified schemas)

- **Text (AR + modified-Qarai EN), matches Frank audio:** `~/Library/Mobile Documents/com~apple~CloudDocs/TSQ/Final Workflow Jul 2025/Resources/Quran_AR-EN_revised.csv` — columns `key,sura,sura name translit,sura name EN,aya,reference,verse AR,verse EN`.
- **Page→verse map:** `~/Library/Mobile Documents/com~apple~CloudDocs/TSQ/Quran Pages/quran_verse_references_by_page_manually_corrected250810_FINAL.csv` — columns `…,page_number,first_verse,last_verse,…` (page 1 → 1:1–1:7, page 2 → 2:1–2:5, page 3 → 2:6–2:16).
- **Frank EN verse audio (exists):** `~/Library/Mobile Documents/com~apple~CloudDocs/TSQ/Final Workflow Jul 2025/Audio/EN/Quran_AR-EN_revised_audio_en_a1TnjruAs5jTzdrjL8Vd/SSSAAA_en.mp3` (zero-padded sura+aya).
- **Husary Muallim recitation:** `https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/SSSAAA.mp3`.
- **Commentary source:** `~/Downloads/Muntakhab-i Tafasir Part 1, pages 1–29.docx` (already extracted to `/tmp/muntakhab.txt`).

### Repo file structure

```
tools/daily/
  config.py            # paths, voice ids, mirror URL, gap default
  verses.py            # PURE: page→verse-keys; verse-keys→rows from revised CSV
  audio.py             # husary_url, fetch, copy_frank, trim_silence (ffmpeg)
  commentary.py        # ElevenLabs v3 (Steve) generation
  build_day.py         # orchestrate: page_no -> daily/data/dayN.json + daily/audio/*
  tests/test_verses.py # pytest for verses.py
content/daily/
  day1.commentary.md   # display text + ## NARRATION script (per style guide)
  day2.commentary.md
  day3.commentary.md
daily/                 # SHIPPED (deployed)
  index.html
  daily.css
  daily.js
  data/day1.json day2.json day3.json
  audio/<SSSAAA>_ar.mp3 <SSSAAA>_en.mp3 dayN_commentary.mp3   (all trimmed)
worker/
  src/index.js         # POST /subscribe -> KV
  wrangler.toml
```

---

## Phase A — Day 1 vertical slice

### Task 1: Verse extraction (pure logic)

**Files:**
- Create: `tools/daily/config.py`, `tools/daily/verses.py`, `tools/daily/tests/test_verses.py`, `tools/daily/tests/fixtures/revised_sample.csv`, `tools/daily/tests/fixtures/pages_sample.csv`

**Interfaces:**
- Produces: `expand_page(pages_csv: str, page_no: int) -> list[str]` (verse keys like `"1:1"`); `verse_rows(revised_csv: str, keys: list[str]) -> list[dict]` where each dict = `{"ref": "1:1", "sura": 1, "aya": 1, "ar": str, "en": str, "code": "001001"}`.

- [ ] **Step 1: Write fixtures**

`tools/daily/tests/fixtures/pages_sample.csv`:
```csv
key,filename,page_number,first_verse,last_verse,raw_response,status
1,page_1.png,1,1:1,1:3,"1:1, 1:3",success
2,page_2.png,2,2:1,2:2,"2:1, 2:2",success
```
`tools/daily/tests/fixtures/revised_sample.csv`:
```csv
key,sura,sura name translit,sura name EN,aya,reference,verse AR,verse EN
1,1,al-Fatihah,The Opening,1,1:1,بِسْمِ,In the Name of God
2,1,al-Fatihah,The Opening,2,1:2,الْحَمْدُ,All praise belongs to God
3,1,al-Fatihah,The Opening,3,1:3,الرَّحْمَٰنِ,the Infinitely Compassionate
```

- [ ] **Step 2: Write the failing test**

`tools/daily/tests/test_verses.py`:
```python
import os
from tools.daily.verses import expand_page, verse_rows

FIX = os.path.join(os.path.dirname(__file__), "fixtures")

def test_expand_page_inclusive_range():
    assert expand_page(f"{FIX}/pages_sample.csv", 1) == ["1:1", "1:2", "1:3"]

def test_expand_page_other_sura():
    assert expand_page(f"{FIX}/pages_sample.csv", 2) == ["2:1", "2:2"]

def test_verse_rows_shape():
    rows = verse_rows(f"{FIX}/revised_sample.csv", ["1:1", "1:3"])
    assert [r["ref"] for r in rows] == ["1:1", "1:3"]
    assert rows[0]["code"] == "001001"
    assert rows[0]["ar"] == "بِسْمِ"
    assert rows[1]["en"] == "the Infinitely Compassionate"
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd "/Users/alex_khaleeli/Claude Code/TQE Marketing" && python3 -m pytest tools/daily/tests/test_verses.py -v`
Expected: FAIL (ModuleNotFoundError: tools.daily.verses)

- [ ] **Step 4: Implement config.py**

```python
import os
TSQ = os.path.expanduser("~/Library/Mobile Documents/com~apple~CloudDocs/TSQ")
REVISED_CSV = f"{TSQ}/Final Workflow Jul 2025/Resources/Quran_AR-EN_revised.csv"
PAGES_CSV   = f"{TSQ}/Quran Pages/quran_verse_references_by_page_manually_corrected250810_FINAL.csv"
FRANK_EN_DIR = f"{TSQ}/Final Workflow Jul 2025/Audio/EN/Quran_AR-EN_revised_audio_en_a1TnjruAs5jTzdrjL8Vd"
HUSARY_URL = "https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps/{code}.mp3"
STEVE_VOICE = "HJlUPggR4CCkl0gC427J"
EL_MODEL = "eleven_v3"
GAP_MS = 200
def code(ref: str) -> str:
    s, a = ref.split(":"); return f"{int(s):03d}{int(a):03d}"
```

- [ ] **Step 5: Implement verses.py**

```python
import csv
from tools.daily.config import code as _code

def expand_page(pages_csv, page_no):
    with open(pages_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["page_number"]) == int(page_no):
                fs, ls = row["first_verse"], row["last_verse"]
                s1, a1 = map(int, fs.split(":")); s2, a2 = map(int, ls.split(":"))
                assert s1 == s2, "POC pages do not span suras"
                return [f"{s1}:{a}" for a in range(a1, a2 + 1)]
    raise ValueError(f"page {page_no} not found")

def verse_rows(revised_csv, keys):
    want = {k: i for i, k in enumerate(keys)}
    found = {}
    with open(revised_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ref = row["reference"].strip()
            if ref in want:
                found[ref] = {
                    "ref": ref, "sura": int(row["sura"]), "aya": int(row["aya"]),
                    "ar": row["verse AR"].strip(), "en": row["verse EN"].strip(),
                    "code": _code(ref),
                }
    return [found[k] for k in keys if k in found]
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd "/Users/alex_khaleeli/Claude Code/TQE Marketing" && python3 -m pytest tools/daily/tests/test_verses.py -v`
Expected: 3 passed. (If pytest missing: `pip3 install pytest`.)

- [ ] **Step 7: Add `tools/__init__.py` and `tools/daily/__init__.py` (empty) so imports resolve; commit**

```bash
touch tools/__init__.py tools/daily/__init__.py
git add tools/ && git commit -m "feat(daily): verse extraction from page map + revised CSV"
```

---

### Task 2: Audio assembly module

**Files:**
- Create: `tools/daily/audio.py`

**Interfaces:**
- Consumes: `config.HUSARY_URL`, `config.FRANK_EN_DIR`, `config.code`.
- Produces: `husary_url(code) -> str`; `fetch(url, dest) -> None`; `copy_frank(code, dest) -> None`; `trim_silence(path) -> float` (returns new duration seconds).

- [ ] **Step 1: Implement audio.py**

```python
import os, shutil, subprocess, urllib.request
from tools.daily.config import HUSARY_URL, FRANK_EN_DIR

def husary_url(code): return HUSARY_URL.format(code=code)

def fetch(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "tqe-daily/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())

def copy_frank(code, dest):
    src = os.path.join(FRANK_EN_DIR, f"{code}_en.mp3")
    if not os.path.exists(src):
        raise FileNotFoundError(src)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copyfile(src, dest)

def trim_silence(path):
    tmp = path + ".trim.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", path,
        "-af", "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-40dB:"
               "stop_periods=1:stop_silence=0.05:stop_threshold=-40dB",
        tmp,
    ], check=True, capture_output=True)
    os.replace(tmp, path)
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())
```

- [ ] **Step 2: Verify against real assets (Fatiha 1:1)**

Run:
```bash
cd "/Users/alex_khaleeli/Claude Code/TQE Marketing"
python3 -c "
from tools.daily import audio
audio.fetch(audio.husary_url('001001'), '/tmp/t_ar.mp3')
audio.copy_frank('001001', '/tmp/t_en.mp3')
import subprocess
def dur(p): return subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip()
print('AR before', dur('/tmp/t_ar.mp3'), 'EN before', dur('/tmp/t_en.mp3'))
print('EN after trim', audio.trim_silence('/tmp/t_en.mp3'))
"
```
Expected: AR/EN durations print; EN-after-trim is meaningfully shorter than EN-before (silence removed). 

- [ ] **Step 3: Commit**

```bash
git add tools/daily/audio.py && git commit -m "feat(daily): audio fetch/copy/silence-trim helpers"
```

---

### Task 3: Day 1 commentary content (prep + script)

**Files:**
- Create: `content/daily/day1.commentary.md`

This is a content task. The Day 1 commentary is the al-Fātiḥa note **"1:6 – The Straight Path"** (already auditioned). Display text keeps transliteration; the `## NARRATION` block uses Arabic script + spelled-out numbers per the style guide.

- [ ] **Step 1: Write the file**

```markdown
# Day 1 — al-Fātiḥa · Commentary

**On "the Straight Path" (1:6)**

## DISPLAY
"The Straight Path" (al-ṣirāṭ al-mustaqīm) means a road that is clearly visible, wide and
straight, without curving or bending in any direction. Here it signifies the religion of
worshipping God, the true faith, and following God's commandments devotedly. Some narrations
identify "the Straight Path" as the Qur'an, while others identify it as the Prophet's
Household (ahl al-bayt) — the only path, laid down by God, that leads to eternal happiness
and is utterly free from error.

## NARRATION
"The Straight Path" — ٱلصِّرَاطَ ٱلْمُسْتَقِيمَ — means a road that is clearly visible, wide and straight, without curving or bending in any direction. Here, it signifies the religion of worshipping God, the true faith, and following God's commandments devotedly. Some narrations identify "the Straight Path" as the Qur'an, while others identify it as the Prophet's Household — أَهْلَ ٱلْبَيْت — the only path, laid down by God, that leads the human being to eternal happiness, and is utterly free from error.
```

- [ ] **Step 2: Commit**

```bash
git add content/daily/day1.commentary.md && git commit -m "content(daily): day 1 commentary (Straight Path), display + narration"
```

---

### Task 4: Commentary audio generation

**Files:**
- Create: `tools/daily/commentary.py`

**Interfaces:**
- Consumes: `~/.keys/elevenlabs.env`, `config.STEVE_VOICE`, `config.EL_MODEL`, `audio.trim_silence`.
- Produces: `generate(narration_text: str, dest: str) -> None` (writes trimmed mp3).

- [ ] **Step 1: Implement commentary.py**

```python
import os, re, json, urllib.request
from tools.daily.config import STEVE_VOICE, EL_MODEL
from tools.daily.audio import trim_silence

def _key():
    for line in open(os.path.expanduser("~/.keys/elevenlabs.env")):
        if "ELEVENLABS_API_KEY=" in line:
            return line.split("=", 1)[1].strip()
    raise RuntimeError("ELEVENLABS_API_KEY not found")

def narration_of(md_path):
    txt = open(md_path, encoding="utf-8").read()
    m = re.search(r"##\s*NARRATION\s*\n(.+)$", txt, re.S)
    return m.group(1).strip()

def generate(narration_text, dest):
    body = json.dumps({"text": narration_text, "model_id": EL_MODEL,
                       "voice_settings": {"stability": 0.5}}).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{STEVE_VOICE}", data=body, method="POST",
        headers={"xi-api-key": _key(), "Content-Type": "application/json", "Accept": "audio/mpeg"})
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
        f.write(r.read())
    trim_silence(dest)
```

- [ ] **Step 2: Generate Day 1 commentary audio**

Run:
```bash
cd "/Users/alex_khaleeli/Claude Code/TQE Marketing"
python3 -c "
from tools.daily import commentary
t = commentary.narration_of('content/daily/day1.commentary.md')
commentary.generate(t, 'daily/audio/day1_commentary.mp3')
print('OK')
"
ffprobe -v error -show_entries format=duration -of csv=p=0 daily/audio/day1_commentary.mp3
```
Expected: `OK` and a duration ~40–55s.

- [ ] **Step 3: Commit (script only — audio committed in Task 5)**

```bash
git add tools/daily/commentary.py && git commit -m "feat(daily): ElevenLabs v3 commentary narration (Steve)"
```

---

### Task 5: Build Day 1 JSON + collect audio

**Files:**
- Create: `tools/daily/build_day.py`
- Produces (data): `daily/data/day1.json`, `daily/audio/<code>_ar.mp3`, `daily/audio/<code>_en.mp3`

**Interfaces:**
- Consumes: `verses.expand_page`, `verses.verse_rows`, `audio.*`, `commentary.narration_of`.
- Produces JSON shape:
```json
{ "day": 1, "page": 1, "surah": "al-Fātiḥa",
  "verses": [ {"ref":"1:1","ar":"…","en":"…","ar_audio":"audio/001001_ar.mp3","en_audio":"audio/001001_en.mp3"} ],
  "commentary": {"title":"On \"the Straight Path\" (1:6)","text":"…DISPLAY…","audio":"audio/day1_commentary.mp3"} }
```

- [ ] **Step 1: Implement build_day.py**

```python
import os, re, json, sys
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
    out_verses = []
    for r in rows:
        c = r["code"]
        ar_dest, en_dest = f"{OUT_AUDIO}/{c}_ar.mp3", f"{OUT_AUDIO}/{c}_en.mp3"
        audio.fetch(audio.husary_url(c), ar_dest); audio.trim_silence(ar_dest)
        audio.copy_frank(c, en_dest);             audio.trim_silence(en_dest)
        out_verses.append({"ref": r["ref"], "ar": r["ar"], "en": r["en"],
                           "ar_audio": f"audio/{c}_ar.mp3", "en_audio": f"audio/{c}_en.mp3"})
    title, text = display_block(f"content/daily/day{day}.commentary.md")
    data = {"day": day, "page": page, "surah": SURAH[rows[0]["sura"]],
            "verses": out_verses,
            "commentary": {"title": title, "text": text, "audio": f"audio/day{day}_commentary.mp3"}}
    os.makedirs(OUT_DATA, exist_ok=True)
    json.dump(data, open(f"{OUT_DATA}/day{day}.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print(f"wrote {OUT_DATA}/day{day}.json with {len(out_verses)} verses")

if __name__ == "__main__":
    build(int(sys.argv[1]), int(sys.argv[2]))  # day page
```

- [ ] **Step 2: Run for Day 1 (page 1)**

Run: `cd "/Users/alex_khaleeli/Claude Code/TQE Marketing" && python3 -m tools.daily.build_day 1 1`
Expected: `wrote daily/data/day1.json with 7 verses`; `daily/audio/` has 7 `_ar`, 7 `_en`, 1 commentary mp3.

- [ ] **Step 3: Commit data + audio**

```bash
git add tools/daily/build_day.py daily/data/day1.json daily/audio/
git commit -m "feat(daily): build day 1 json + collect trimmed audio"
```

---

### Task 6: Daily page shell (HTML/CSS)

**Files:**
- Create: `daily/index.html`, `daily/daily.css`

- [ ] **Step 1: Write `daily/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Qur'an: Explained — Daily (Preview)</title>
  <link rel="icon" href="/assets/favicon.ico">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&family=Scheherazade+New:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="daily.css">
</head>
<body>
  <header class="dhead">
    <a class="dhead__back" href="/">← The Qur'an: Explained</a>
    <span class="dhead__badge">Preview</span>
  </header>
  <main class="dwrap">
    <div class="dtabs" id="dtabs"><!-- day buttons injected --></div>
    <h1 class="dtitle"><span id="dsurah"></span> <small id="dref"></small></h1>
    <div class="controls"><button id="playAll" class="btn btn--primary">▶ Play page</button></div>
    <ol class="verses" id="verses"><!-- verses injected --></ol>
    <section class="commentary" id="commentary">
      <h2 id="cmtTitle"></h2>
      <p id="cmtText"></p>
      <button id="playCmt" class="btn btn--ghost">▶ Play commentary</button>
    </section>
    <section class="subscribe">
      <h2>Get the daily Qur'an in your inbox</h2>
      <form id="subForm"><input type="email" id="subEmail" required placeholder="you@example.com"><button class="btn btn--primary">Notify me</button></form>
      <p class="subscribe__msg" id="subMsg"></p>
    </section>
  </main>
  <script src="daily.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Write `daily/daily.css`** (palette + Arabic/serif, active-verse highlight)

```css
:root{--navy:#0E2748;--brass:#C9A24A;--cream:#FBF7EE;--ink:#1A1A1A;--muted:#5A5A5A;--border:rgba(14,39,72,.12)}
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:var(--cream);color:var(--ink)}
.dhead{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;background:var(--navy);color:var(--cream)}
.dhead__back{color:var(--cream);text-decoration:none;font-family:'EB Garamond',serif;font-size:1.05rem}
.dhead__badge{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;background:var(--brass);color:var(--navy);padding:3px 10px;border-radius:999px}
.dwrap{max-width:760px;margin:0 auto;padding:32px 24px 80px}
.dtabs{display:flex;gap:8px;margin-bottom:20px}
.dtab{padding:8px 16px;border:1px solid var(--border);border-radius:999px;background:#fff;cursor:pointer;font:inherit}
.dtab--active{background:var(--navy);color:var(--cream);border-color:var(--navy)}
.dtitle{font-family:'EB Garamond',serif;color:var(--navy)}.dtitle small{color:var(--muted);font-size:1rem}
.btn{font:inherit;font-weight:600;border:0;border-radius:6px;padding:10px 18px;cursor:pointer}
.btn--primary{background:var(--brass);color:var(--navy)}.btn--ghost{background:transparent;border:1.5px solid var(--brass);color:var(--navy)}
.controls{margin:12px 0 24px}
.verses{list-style:none;padding:0;margin:0}
.verse{padding:16px;border-radius:8px;border:1px solid transparent;cursor:pointer;transition:background .2s,border-color .2s}
.verse__ar{font-family:'Scheherazade New',serif;font-size:1.9rem;line-height:2.4;direction:rtl;text-align:right;color:var(--navy)}
.verse__en{font-family:'EB Garamond',serif;font-size:1.15rem;color:var(--ink);margin-top:6px}
.verse__ref{font-size:.8rem;color:var(--muted)}
.verse.is-active{background:#fff;border-color:var(--brass);box-shadow:0 2px 8px rgba(14,39,72,.08)}
.verse.is-speaking-en .verse__en{color:var(--navy);font-weight:500}
.commentary{margin-top:32px;padding:24px;background:var(--navy);color:var(--cream);border-radius:10px}
.commentary h2{font-family:'EB Garamond',serif;margin-top:0}
.commentary.is-active{box-shadow:0 0 0 2px var(--brass)}
.subscribe{margin-top:32px}.subscribe form{display:flex;gap:8px}.subscribe input{flex:1;padding:10px;border:1px solid var(--border);border-radius:6px;font:inherit}
.subscribe__msg{color:var(--muted);font-size:.9rem;min-height:1.2em}
@media(max-width:560px){.verse__ar{font-size:1.6rem}.subscribe form{flex-direction:column}}
```

- [ ] **Step 3: Verify it loads (no data yet)**

Run: `cd "/Users/alex_khaleeli/Claude Code/TQE Marketing" && npx --no-install playwright screenshot --viewport-size="900,1200" "file://$PWD/daily/index.html" /tmp/daily_shell.png`
Then Read `/tmp/daily_shell.png`. Expected: header with "Preview" badge, empty page scaffold, subscribe form visible.

- [ ] **Step 4: Commit**

```bash
git add daily/index.html daily/daily.css && git commit -m "feat(daily): page shell + styles"
```

---

### Task 7: Sequenced player + rendering (JS)

**Files:**
- Create: `daily/daily.js`

**Interfaces:**
- Consumes: `daily/data/day{N}.json`. Builds verse list, runs the `AR1→EN1→…→commentary` playlist with active-verse highlight and a `GAP_MS` (200) pause; tap a verse to play from it; wires the subscribe form to POST `/subscribe`.

- [ ] **Step 1: Write `daily/daily.js`**

```javascript
const GAP_MS = 200;
const DAYS = [1, 2, 3];
let current = null, audio = new Audio(), queue = [], qi = 0, playing = false;

const $ = (s) => document.querySelector(s);

async function loadDay(n) {
  const data = await (await fetch(`data/day${n}.json`)).json();
  current = data;
  $("#dsurah").textContent = data.surah;
  $("#dref").textContent = `· Day ${data.day}`;
  $("#cmtTitle").textContent = data.commentary.title;
  $("#cmtText").textContent = data.commentary.text;
  const ol = $("#verses"); ol.innerHTML = "";
  data.verses.forEach((v, i) => {
    const li = document.createElement("li");
    li.className = "verse"; li.dataset.i = i;
    li.innerHTML = `<div class="verse__ar">${v.ar}</div><div class="verse__en">${v.en}</div><div class="verse__ref">${v.ref}</div>`;
    li.addEventListener("click", () => playFrom(i));
    ol.appendChild(li);
  });
  document.querySelectorAll(".dtab").forEach(t => t.classList.toggle("dtab--active", +t.dataset.n === n));
}

function buildQueue() {
  queue = [];
  current.verses.forEach((v, i) => {
    queue.push({ src: v.ar_audio, vi: i, mode: "ar" });
    queue.push({ src: v.en_audio, vi: i, mode: "en" });
  });
  queue.push({ src: current.commentary.audio, vi: -1, mode: "cmt" });
}

function clearHL() {
  document.querySelectorAll(".verse").forEach(e => e.classList.remove("is-active", "is-speaking-en"));
  $("#commentary").classList.remove("is-active");
}

function highlight(step) {
  clearHL();
  if (step.mode === "cmt") { $("#commentary").classList.add("is-active"); return; }
  const el = document.querySelector(`.verse[data-i="${step.vi}"]`);
  el.classList.add("is-active");
  if (step.mode === "en") el.classList.add("is-speaking-en");
  el.scrollIntoView({ block: "center", behavior: "smooth" });
}

function playStep() {
  if (qi >= queue.length) { playing = false; clearHL(); return; }
  const step = queue[qi]; highlight(step);
  audio.src = step.src; audio.play();
}
audio.addEventListener("ended", () => {
  qi++; if (!playing) return;
  setTimeout(playStep, GAP_MS);
});

function playAll() { buildQueue(); qi = 0; playing = true; playStep(); }
function playFrom(i) { buildQueue(); qi = queue.findIndex(s => s.vi === i); playing = true; playStep(); }
function playCommentary() { buildQueue(); qi = queue.length - 1; playing = true; playStep(); }

async function subscribe(e) {
  e.preventDefault();
  const email = $("#subEmail").value;
  $("#subMsg").textContent = "…";
  try {
    const r = await fetch("/subscribe", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "daily" }) });
    $("#subMsg").textContent = r.ok ? "Thank you — you're on the list." : "Something went wrong. Please try again.";
  } catch { $("#subMsg").textContent = "Something went wrong. Please try again."; }
}

function init() {
  const tabs = $("#dtabs");
  DAYS.forEach(n => {
    const b = document.createElement("button");
    b.className = "dtab"; b.dataset.n = n; b.textContent = `Day ${n}`;
    b.addEventListener("click", () => loadDay(n)); tabs.appendChild(b);
  });
  $("#playAll").addEventListener("click", playAll);
  $("#playCmt").addEventListener("click", playCommentary);
  $("#subForm").addEventListener("submit", subscribe);
  loadDay(1);
}
init();
```

- [ ] **Step 2: Verify rendering + highlight with Playwright**

Create `/tmp/daily_check.mjs`:
```javascript
import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
const dir = process.argv[2];
await p.goto('file://' + dir + '/daily/index.html');
await p.waitForSelector('.verse');
const count = await p.locator('.verse').count();
console.log('verses rendered:', count);
console.log('ar of first verse:', await p.locator('.verse__ar').first().innerText());
await p.locator('.verse').first().click();           // playFrom(0) -> first AR active
await p.waitForTimeout(300);
console.log('first verse active:', await p.locator('.verse').first().evaluate(e => e.classList.contains('is-active')));
await b.close();
```
Run: `cd "/Users/alex_khaleeli/Claude Code/TQE Marketing" && node /tmp/daily_check.mjs "$PWD"`
Expected: `verses rendered: 7`, Arabic text prints, `first verse active: true`. (Audio won't actually sound headless, but the highlight/state path is exercised.)

- [ ] **Step 3: Manual end-to-end listen**

Run: `open "/Users/alex_khaleeli/Claude Code/TQE Marketing/daily/index.html"` (or serve), click **Play page**; confirm AR→EN per verse with highlight, tight gaps, then commentary. Adjust `GAP_MS` if needed.

- [ ] **Step 4: Commit**

```bash
git add daily/daily.js && git commit -m "feat(daily): sequenced AR→EN→commentary player with verse highlight"
```

---

### Task 8: Deploy Day 1 + link from Phase 2 card

**Files:**
- Modify: `.github/workflows/deploy.yml` (stage `daily/`), `index.html` (Phase 3/landing link — add a Preview link to the Phase 2 card)

- [ ] **Step 1: Extend the deploy workflow** — in `.github/workflows/deploy.yml`, in the "Stage static site" step, add after the `cp -R assets dist/assets` line:

```yaml
          cp -R daily dist/daily
```

- [ ] **Step 2: Add a Preview link on the Phase 2 card** — in `index.html`, inside the Phase 2 `article.card.phase--planned` (the "Daily Qur'an Challenge" card), add before `</article>`:

```html
        <p class="phase__preview"><a href="/daily" class="inline-link">Try the preview →</a></p>
```

- [ ] **Step 3: Commit, push, verify the Action deploys**

```bash
cd "/Users/alex_khaleeli/Claude Code/TQE Marketing"
git add .github/workflows/deploy.yml index.html
git commit -m "feat(daily): deploy /daily and link it from the Phase 2 card"
git push origin HEAD
```
Then: `rid=$(gh run list --limit 1 --json databaseId -q '.[0].databaseId'); gh run watch "$rid" --exit-status`
Expected: run success.

- [ ] **Step 4: Verify live**

Run: `curl -s https://quran-explained.pages.dev/daily/ | grep -c "verse\|Preview"` and load `https://quraniverse.io/daily` in a browser; confirm Day 1 plays end-to-end.

---

## Phase B — Days 2 & 3

### Task 9: Generate Days 2 and 3

**Files:**
- Create: `content/daily/day2.commentary.md`, `content/daily/day3.commentary.md`
- Produces: `daily/data/day2.json`, `daily/data/day3.json`, audio for pages 2–3.

- [ ] **Step 1: Pick + script commentary notes** from `/tmp/muntakhab.txt` — Day 2 (page 2 = 2:1–2:5): use note **"2:2 – Guidance: The Purpose for which the Qur'an was Revealed"**. Day 3 (page 3 = 2:6–2:16): use note **"2:6 – The faithless refuse to accept guidance"**. Create each `content/daily/dayN.commentary.md` in the same format as Task 3 (`# Day N …`, `**On …**`, `## DISPLAY`, `## NARRATION`), Arabic terms in Arabic script, numbers as words. (Read the exact note bodies from `/tmp/muntakhab.txt`; do not paraphrase beyond light trimming for length.)

- [ ] **Step 2: Generate commentary audio for Days 2 & 3**

```bash
cd "/Users/alex_khaleeli/Claude Code/TQE Marketing"
for d in 2 3; do python3 -c "
from tools.daily import commentary
commentary.generate(commentary.narration_of('content/daily/day$d.commentary.md'),'daily/audio/day${d}_commentary.mp3')
print('day $d OK')"; done
```

- [ ] **Step 3: Build Days 2 & 3**

```bash
python3 -m tools.daily.build_day 2 2
python3 -m tools.daily.build_day 3 3
```
Expected: `day2.json` (5 verses), `day3.json` (11 verses).

- [ ] **Step 4: Verify 3-day switching** — `node /tmp/daily_check.mjs "$PWD"` still passes; manually click Day 2 / Day 3 tabs and Play page on each.

- [ ] **Step 5: Commit, push (auto-deploys)**

```bash
git add content/daily/ daily/data/ daily/audio/
git commit -m "feat(daily): add days 2 & 3 (al-Baqara pages 2–3)"
git push origin HEAD
```

---

## Phase C — Email capture (real)

### Task 10: Cloudflare Worker + KV

**Files:**
- Create: `worker/src/index.js`, `worker/wrangler.toml`

- [ ] **Step 1: Write `worker/src/index.js`**

```javascript
export default {
  async fetch(request, env) {
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });
    let email, source;
    try { ({ email, source } = await request.json()); } catch { return new Response("Bad JSON", { status: 400, headers: cors }); }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return new Response("Invalid email", { status: 422, headers: cors });
    await env.SUBSCRIBERS.put(`${Date.now()}:${email}`, JSON.stringify({ email, source: source || "daily", ts: new Date().toISOString() }));
    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  },
};
```

- [ ] **Step 2: Write `worker/wrangler.toml`**

```toml
name = "quraniverse-subscribe"
main = "src/index.js"
compatibility_date = "2026-01-01"

[[kv_namespaces]]
binding = "SUBSCRIBERS"
id = "PLACEHOLDER_FILLED_IN_STEP_3"
```

- [ ] **Step 3: Create the KV namespace and fill the id**

```bash
cd "/Users/alex_khaleeli/Claude Code/TQE Marketing/worker"
# Cloudflare creds (do NOT commit the token). Token: the wide Zone/DNS/Pages/SSL/Account
# token from memory `credentials_cloudflare.md`; account id is not secret.
export CLOUDFLARE_API_TOKEN='<wide Cloudflare API token — from ~/.keys or credentials_cloudflare.md>'
export CLOUDFLARE_ACCOUNT_ID=226038254608c5105e6403f21953b6a8
npx --yes wrangler@4 kv namespace create SUBSCRIBERS
```
Copy the printed `id` into `wrangler.toml` (replace PLACEHOLDER).

- [ ] **Step 4: Deploy + test the endpoint**

```bash
npx --yes wrangler@4 deploy
# note the printed *.workers.dev URL, then:
curl -s -X POST "<workers-dev-url>" -H "Content-Type: application/json" -d '{"email":"test@example.com","source":"daily"}'
```
Expected: `{"ok":true}`. Verify the key exists: `npx wrangler@4 kv key list --binding SUBSCRIBERS` (or via dashboard).

- [ ] **Step 5: Commit**

```bash
git add worker/ && git commit -m "feat(daily): subscribe worker (KV-backed email capture)"
```

### Task 11: Wire the form to the Worker

**Files:**
- Modify: `daily/daily.js` (replace `/subscribe` with the deployed worker URL), or add a Pages route. Simplest: set `const SUBSCRIBE_URL = "<workers-dev-url>";` at top of `daily.js` and use it in `subscribe()`.

- [ ] **Step 1:** Add `const SUBSCRIBE_URL = "<workers-dev-url>";` and change the fetch in `subscribe()` to `fetch(SUBSCRIBE_URL, …)`.
- [ ] **Step 2: Verify** — load `/daily`, submit a test email, confirm "Thank you — you're on the list." and the key lands in KV.
- [ ] **Step 3: Commit + push (auto-deploys)**

```bash
git add daily/daily.js && git commit -m "feat(daily): connect subscribe form to worker" && git push origin HEAD
```

---

## Phase D — Final verification

### Task 12: End-to-end check + polish

- [ ] **Step 1:** On `https://quraniverse.io/daily`: each of Days 1–3 plays AR→EN→commentary with highlight + tight gaps; tap-to-play works; subscribe succeeds.
- [ ] **Step 2:** Mobile check via Playwright at 375px (`npx --no-install playwright screenshot --viewport-size="375,812" "file://$PWD/daily/index.html" /tmp/daily_m.png`); fix any overflow.
- [ ] **Step 3:** Confirm the Phase 2 card "Try the preview →" link works from the live landing page.
- [ ] **Step 4:** Update memory (`project_tqe_landing.md`): POC shipped, `/daily` live, worker URL + KV namespace id.

---

## Notes / decisions folded in

- Text source = `Quran_AR-EN_revised.csv` (matches existing Frank EN audio exactly).
- Day 1 commentary = "Straight Path" (1:6); Days 2–3 chosen in Task 9.
- All fragment audio silence-trimmed; player gap = 200 ms (tune in `daily.js`).
- Worker uses the existing wide CF token locally for deploy; no secrets in repo.
