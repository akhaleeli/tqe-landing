import os

TSQ = os.path.expanduser("~/Library/Mobile Documents/com~apple~CloudDocs/TSQ")
REVISED_CSV = f"{TSQ}/Final Workflow Jul 2025/Resources/Quran_AR-EN_revised.csv"
PAGES_CSV = f"{TSQ}/Quran Pages/quran_verse_references_by_page_manually_corrected250810_FINAL.csv"
FRANK_EN_DIR = f"{TSQ}/Final Workflow Jul 2025/Audio/EN/Quran_AR-EN_revised_audio_en_a1TnjruAs5jTzdrjL8Vd"
MIRROR = "https://mirrors.quranicaudio.com/everyayah/{folder}/{code}.mp3"
RECITERS = {
    "husary": "Husary_128kbps",
    "afasy": "Alafasy_128kbps",
    "sudais": "Abdurrahmaan_As-Sudais_192kbps",
}
FRANK_VOICE = "a1TnjruAs5jTzdrjL8Vd"
STEVE_VOICE = "HJlUPggR4CCkl0gC427J"
CELESTE_VOICE = "wSRCyzJYBsTZLFcumuu8"
# English-translation voices: v1 = Frank (reuse existing TSQ files, None); others = ElevenLabs voice id
EN_VOICES = {"v1": None, "v2": STEVE_VOICE, "celeste": CELESTE_VOICE}
# Commentary/intro voices (all generated fresh via ElevenLabs)
COMMENTARY_VOICES = {"v1": FRANK_VOICE, "v2": STEVE_VOICE, "celeste": CELESTE_VOICE}
EL_MODEL = "eleven_v3"
GAP_MS = 200


def code(ref: str) -> str:
    s, a = ref.split(":")
    return f"{int(s):03d}{int(a):03d}"
