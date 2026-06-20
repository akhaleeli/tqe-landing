import csv
from tools.daily.config import code as _code


def expand_page(pages_csv, page_no):
    with open(pages_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["page_number"]) == int(page_no):
                fs, ls = row["first_verse"], row["last_verse"]
                s1, a1 = map(int, fs.split(":"))
                s2, a2 = map(int, ls.split(":"))
                assert s1 == s2, "POC pages do not span suras"
                return [f"{s1}:{a}" for a in range(a1, a2 + 1)]
    raise ValueError(f"page {page_no} not found")


def verse_rows(revised_csv, keys):
    want = set(keys)
    found = {}
    with open(revised_csv, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ref = row["reference"].strip()
            if ref in want:
                found[ref] = {
                    "ref": ref,
                    "sura": int(row["sura"]),
                    "aya": int(row["aya"]),
                    "ar": row["verse AR"].strip(),
                    "en": row["verse EN"].strip(),
                    "code": _code(ref),
                }
    return [found[k] for k in keys if k in found]
