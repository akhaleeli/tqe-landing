import os
import shutil
import subprocess
import urllib.request

from tools.daily.config import HUSARY_URL, FRANK_EN_DIR


def husary_url(code):
    return HUSARY_URL.format(code=code)


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


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def trim_silence(path):
    # Trim leading + trailing silence only (not internal pauses) via the
    # reverse-trim-reverse idiom, leaving ~120ms of lead/tail (start_silence) so soft
    # onsets are never clipped and each clip has a gentle breath.
    flt = ("silenceremove=start_periods=1:start_duration=0.05:"
           "start_threshold=-45dB:start_silence=0.12")
    tmp = path + ".trim.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-i", path,
        "-af", f"{flt},areverse,{flt},areverse",
        tmp,
    ], check=True, capture_output=True)
    os.replace(tmp, path)
    return duration(path)
