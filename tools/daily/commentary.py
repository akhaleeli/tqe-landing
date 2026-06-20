import json
import os
import re
import urllib.request

from tools.daily.config import STEVE_VOICE, EL_MODEL
from tools.daily.audio import trim_silence


def _key():
    path = os.path.expanduser("~/.keys/elevenlabs.env")
    for line in open(path):
        if "ELEVENLABS_API_KEY=" in line:
            return line.split("=", 1)[1].strip()
    raise RuntimeError("ELEVENLABS_API_KEY not found in ~/.keys/elevenlabs.env")


def narration_of(md_path):
    txt = open(md_path, encoding="utf-8").read()
    m = re.search(r"##\s*NARRATION\s*\n(.+)$", txt, re.S)
    if not m:
        raise ValueError(f"No ## NARRATION section in {md_path}")
    return m.group(1).strip()


def generate(narration_text, dest, voice=STEVE_VOICE):
    body = json.dumps({
        "text": narration_text,
        "model_id": EL_MODEL,
        "voice_settings": {"stability": 0.5},
    }).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
        data=body, method="POST",
        headers={"xi-api-key": _key(), "Content-Type": "application/json",
                 "Accept": "audio/mpeg"},
    )
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
        f.write(r.read())
    trim_silence(dest)
