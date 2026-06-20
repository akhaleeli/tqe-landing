import os

TSQ = os.path.expanduser("~/Library/Mobile Documents/com~apple~CloudDocs/TSQ")
REVISED_CSV = f"{TSQ}/Final Workflow Jul 2025/Resources/Quran_AR-EN_revised.csv"
PAGES_CSV = f"{TSQ}/Quran Pages/quran_verse_references_by_page_manually_corrected250810_FINAL.csv"
FRANK_EN_DIR = f"{TSQ}/Final Workflow Jul 2025/Audio/EN/Quran_AR-EN_revised_audio_en_a1TnjruAs5jTzdrjL8Vd"
HUSARY_URL = "https://mirrors.quranicaudio.com/everyayah/Husary_128kbps/{code}.mp3"
STEVE_VOICE = "HJlUPggR4CCkl0gC427J"
EL_MODEL = "eleven_v3"
GAP_MS = 200


def code(ref: str) -> str:
    s, a = ref.split(":")
    return f"{int(s):03d}{int(a):03d}"
