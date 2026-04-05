"""
extract_text.py
---------------
Fetches the Abdel Haleem English translation (ID 85) from the public
Quran.com v4 API, normalises the text, and returns an iterable of
  (surah_number: int, surah_slug: str, full_text: str)
tuples ready for synthesis.

Note: The "Clear Quran" by Dr. Mustafa Khattab (translation 131) is not
available via the Quran.com public API. Translation 85 (M.A.S. Abdel Haleem,
Oxford World's Classics) is used instead — it is the closest freely-available
modern British English equivalent.

Text normalisation steps
-------------------------
1. Strip HTML tags (including <sup foot_note=...> footnote markers from API).
2. Remove Arabic / Unicode diacritics.
3. Remove numeric footnote references (e.g. "¹", "[1]", "(1)").
4. Expand the Islamic phonetic substitution table so that the British Alan
   voice pronounces key terms naturally.
5. Clean up punctuation and excessive whitespace.
"""

import re
import json
import time
import sys
from typing import Generator, Tuple
import requests

# ---------------------------------------------------------------------------
# Quran.com API configuration
# ---------------------------------------------------------------------------
API_BASE = "https://api.quran.com/api/v4"
# Translation 85 = M.A.S. Abdel Haleem (Oxford) — clearest modern British English
# available via the free Quran.com API.
TRANSLATION_ID = 85
PER_PAGE = 50                 # safe page size for the Quran.com API

# ---------------------------------------------------------------------------
# Surah metadata: (slug_for_filename, English name for display)
# ---------------------------------------------------------------------------
SURAH_NAMES: dict[int, str] = {
    1: "Al_Fatihah", 2: "Al_Baqarah", 3: "Ali_Imran", 4: "An_Nisa",
    5: "Al_Maidah", 6: "Al_Anam", 7: "Al_Araf", 8: "Al_Anfal",
    9: "At_Tawbah", 10: "Yunus", 11: "Hud", 12: "Yusuf",
    13: "Ar_Rad", 14: "Ibrahim", 15: "Al_Hijr", 16: "An_Nahl",
    17: "Al_Isra", 18: "Al_Kahf", 19: "Maryam", 20: "Ta_Ha",
    21: "Al_Anbiya", 22: "Al_Hajj", 23: "Al_Muminun", 24: "An_Nur",
    25: "Al_Furqan", 26: "Ash_Shuara", 27: "An_Naml", 28: "Al_Qasas",
    29: "Al_Ankabut", 30: "Ar_Rum", 31: "Luqman", 32: "As_Sajdah",
    33: "Al_Ahzab", 34: "Saba", 35: "Fatir", 36: "Ya_Sin",
    37: "As_Saffat", 38: "Sad", 39: "Az_Zumar", 40: "Ghafir",
    41: "Fussilat", 42: "Ash_Shura", 43: "Az_Zukhruf", 44: "Ad_Dukhan",
    45: "Al_Jathiyah", 46: "Al_Ahqaf", 47: "Muhammad", 48: "Al_Fath",
    49: "Al_Hujurat", 50: "Qaf", 51: "Adh_Dhariyat", 52: "At_Tur",
    53: "An_Najm", 54: "Al_Qamar", 55: "Ar_Rahman", 56: "Al_Waqiah",
    57: "Al_Hadid", 58: "Al_Mujadila", 59: "Al_Hashr", 60: "Al_Mumtahanah",
    61: "As_Saf", 62: "Al_Jumuah", 63: "Al_Munafiqun", 64: "At_Taghabun",
    65: "At_Talaq", 66: "At_Tahrim", 67: "Al_Mulk", 68: "Al_Qalam",
    69: "Al_Haqqah", 70: "Al_Maarij", 71: "Nuh", 72: "Al_Jinn",
    73: "Al_Muzzammil", 74: "Al_Muddaththir", 75: "Al_Qiyamah",
    76: "Al_Insan", 77: "Al_Mursalat", 78: "An_Naba", 79: "An_Naziat",
    80: "Abasa", 81: "At_Takwir", 82: "Al_Infitar", 83: "Al_Mutaffifin",
    84: "Al_Inshiqaq", 85: "Al_Buruj", 86: "At_Tariq", 87: "Al_Ala",
    88: "Al_Ghashiyah", 89: "Al_Fajr", 90: "Al_Balad", 91: "Ash_Shams",
    92: "Al_Layl", 93: "Ad_Duha", 94: "Ash_Sharh", 95: "At_Tin",
    96: "Al_Alaq", 97: "Al_Qadr", 98: "Al_Bayyinah", 99: "Az_Zalzalah",
    100: "Al_Adiyat", 101: "Al_Qariah", 102: "At_Takathur", 103: "Al_Asr",
    104: "Al_Humazah", 105: "Al_Fil", 106: "Quraysh", 107: "Al_Maun",
    108: "Al_Kawthar", 109: "Al_Kafirun", 110: "An_Nasr", 111: "Al_Masad",
    112: "Al_Ikhlas", 113: "Al_Falaq", 114: "An_Nas",
}

# ---------------------------------------------------------------------------
# Phonetic substitution dictionary
# Key  = term as it appears in Clear Quran translation text
# Val  = phonetic respelling tuned for Alan (British) voice
# ---------------------------------------------------------------------------
PHONETIC_MAP: list[Tuple[str, str]] = [
    # Core theology
    (r"\bAllah\b",           "All-lah"),
    (r"\bAllah's\b",         "All-lah's"),
    (r"\bIslam\b",           "Iz-lahm"),
    (r"\bMuslim(s)?\b",      lambda m: "Mooz-lim" + ("s" if m.group(1) else "")),
    (r"\bQuran\b",           "Koran"),
    (r"\bMuhammad\b",        "Mo-ham-med"),
    (r"\bIbrahim\b",         "Ib-rah-heem"),
    (r"\bIsmail\b",          "Iss-mah-eel"),
    (r"\bIshaq\b",           "Iss-hark"),
    (r"\bYaqub\b",           "Yah-koob"),
    (r"\bYusuf\b",           "You-suf"),
    (r"\bMusa\b",            "Moo-sah"),
    (r"\bIsa\b",             "Ee-sah"),
    (r"\bMaryam\b",          "Mar-yam"),
    (r"\bDawood\b",          "Da-wood"),
    (r"\bSulaiman\b",        "Soo-lay-man"),
    (r"\bNuh\b",             "Noo-h"),
    (r"\bAdam\b",            "Ah-dam"),
    (r"\bHarun\b",           "Ha-roon"),
    (r"\bIdris\b",           "Id-rees"),
    (r"\bLut\b",             "Loot"),
    (r"\bHud\b",             "Hood"),
    (r"\bSalih\b",           "Saw-lih"),
    (r"\bShuaib\b",          "Shoo-ayb"),
    (r"\bZakariyya\b",       "Zak-ah-ree-yah"),
    (r"\bYahya\b",           "Yah-yah"),
    (r"\bJibril\b",          "Jib-reel"),
    # Theological concepts  
    (r"\bAkhirah\b",         "Aa-khi-rah"),
    (r"\bJannah\b",          "Jan-nah"),
    (r"\bJahannam\b",        "Ja-han-nam"),
    (r"\bZakat\b",           "Zah-kaht"),
    (r"\bSalah\b",           "Sa-lah"),
    (r"\bHajj\b",            "Hodge"),
    (r"\bSawm\b",            "Sow-m"),
    (r"\bTaqwa\b",           "Tack-wah"),
    (r"\bShaytan\b",         "Shay-tan"),
    (r"\bIblis\b",           "Ib-lees"),
    (r"\bJinn\b",            "Jin"),
    (r"\bAnsar\b",           "An-sar"),
    (r"\bMuhajirin\b",       "Moo-hah-ji-reen"),
    (r"\bAnsaar\b",          "An-sar"),
    # Place names
    (r"\bMecca\b",           "Mek-kah"),
    (r"\bMadinah\b",         "Ma-dee-nah"),
    (r"\bMedina\b",          "Ma-dee-nah"),
    (r"\bKa'bah?\b",         "Kaa-bah"),
    (r"\bArafat\b",          "Ara-fat"),
]

# Pre-compile regex patterns for speed
_COMPILED_PHONETIC: list = []
for pattern, replacement in PHONETIC_MAP:
    _COMPILED_PHONETIC.append((re.compile(pattern), replacement))


def _apply_phonetic_map(text: str) -> str:
    for regex, repl in _COMPILED_PHONETIC:
        text = regex.sub(repl, text)
    return text


# ---------------------------------------------------------------------------
# HTML / footnote tag stripping
# ---------------------------------------------------------------------------
_HTML_TAG   = re.compile(r"<[^>]+>")
_FOOTNOTE   = re.compile(r"[\[({]?\d+[\])}]")   # e.g. [1], (2), ¹
_SUPERSCRIPT = re.compile(r"[¹²³⁴⁵⁶⁷⁸⁹⁰]+")
_ARABIC     = re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+")
_MULTI_SPACE = re.compile(r"  +")
_MULTI_NL   = re.compile(r"\n{3,}")


def normalise(text: str) -> str:
    """Clean raw API translation text for Piper."""
    # The Quran.com API wraps footnote numbers in <sup foot_note=NNN>N</sup>.
    # Strip those first so the number inside doesn't survive as a bare digit.
    text = re.sub(r"<sup[^>]*>\d+</sup>", "", text)
    text = _HTML_TAG.sub(" ", text)           # strip any remaining HTML tags
    text = _ARABIC.sub(" ", text)             # remove Arabic glyphs
    text = _SUPERSCRIPT.sub("", text)         # remove superscript digits
    text = _FOOTNOTE.sub("", text)            # remove bracketed footnote refs
    text = text.replace("ʿ", "").replace("ʾ", "").replace("'", "'")
    text = text.replace("—", ", ").replace("–", ", ")
    text = _apply_phonetic_map(text)
    text = _MULTI_SPACE.sub(" ", text)
    text = _MULTI_NL.sub("\n\n", text)
    return text.strip()


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------
def _fetch_surah_translations(surah_number: int) -> list[str]:
    """Return a list of normalised verse translation strings for one Surah."""
    verses: list[str] = []
    page = 1
    while True:
        # NOTE: do NOT include a `fields` param — it overrides the default
        # field set and causes `translations` to be omitted from the response.
        url = (
            f"{API_BASE}/verses/by_chapter/{surah_number}"
            f"?translations={TRANSLATION_ID}"
            f"&per_page={PER_PAGE}"
            f"&page={page}"
        )
        for attempt in range(5):
            try:
                resp = requests.get(url, timeout=30)
                resp.raise_for_status()
                break
            except requests.RequestException as exc:
                wait = 2 ** attempt
                print(f"    [retry {attempt+1}] {exc} — waiting {wait}s …")
                time.sleep(wait)
        else:
            print(f"ERROR: could not fetch Surah {surah_number}.", file=sys.stderr)
            sys.exit(1)

        data = resp.json()
        for verse in data.get("verses", []):
            for t in verse.get("translations", []):
                verses.append(normalise(t.get("text", "")))

        pagination = data.get("pagination", {})
        if page >= pagination.get("total_pages", 1):
            break
        page += 1
        time.sleep(0.15)      # gentle rate-limiting

    return verses


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------
def get_quran_data(
    start: int = 1, end: int = 114
) -> Generator[Tuple[int, str, str], None, None]:
    """
    Yield (surah_number, filename_slug, full_text) for Surahs start..end.

    ``full_text`` is a single space-joined string of all verse translations,
    normalised and phonetically adjusted.
    """
    for surah_num in range(start, end + 1):
        slug = SURAH_NAMES.get(surah_num, f"Surah_{surah_num}")
        print(f"  Fetching Surah {surah_num:3d}/{end}: {slug} …")
        verses = _fetch_surah_translations(surah_num)
        # Join verses with a short pause represented by punctuation so Piper
        # renders a natural breath between ayahs.
        full_text = "  ".join(v for v in verses if v)
        yield surah_num, slug, full_text


# ---------------------------------------------------------------------------
# Quick smoke-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("Fetching Surah 1 (Al-Fatihah) as smoke test …\n")
    for num, slug, text in get_quran_data(start=1, end=1):
        print(f"Surah {num} — {slug}")
        print("-" * 60)
        print(text)
