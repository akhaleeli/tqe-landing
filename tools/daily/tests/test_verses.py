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
