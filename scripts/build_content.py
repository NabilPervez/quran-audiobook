"""
build_content.py
----------------
Writes the verse text the app displays to static JSON, one file per surah:

    sacred-stream/public/data/text/001.json … 114.json
    { "id": 1, "verses": [ { "n": 1, "en": "...", "ar": "..." }, ... ] }

English is the Abdel Haleem translation (id 85), the same text the narration
was synthesised from, with footnote markers and markup removed but *without*
the phonetic respellings used for TTS. Arabic is the Uthmani script.

Serving these files statically lets the app read offline, keeps text and audio
in lock-step, and removes the runtime dependency on api.quran.com.

Usage
    pip install requests
    python scripts/build_content.py
"""

import html
import json
import re
import time
from pathlib import Path

import requests

API = "https://api.quran.com/api/v4"
TRANSLATION_ID = 85
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "sacred-stream" / "public" / "data" / "text"

_FOOTNOTE = re.compile(r"<sup[^>]*>.*?</sup>", re.S)
_TAG = re.compile(r"<[^>]+>")
_SPACES = re.compile(r"\s+")


def display_text(raw: str) -> str:
    text = _FOOTNOTE.sub("", raw)
    text = _TAG.sub("", text)
    text = html.unescape(text)
    return _SPACES.sub(" ", text).strip()


def get(url: str) -> dict:
    for attempt in range(5):
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            wait = 2 ** attempt
            print(f"    retry {attempt + 1}: {exc} (waiting {wait}s)")
            time.sleep(wait)
    raise SystemExit(f"Could not fetch {url}")


def build_surah(surah_id: int) -> dict:
    en = get(f"{API}/verses/by_chapter/{surah_id}?translations={TRANSLATION_ID}&per_page=300&words=false")
    ar = get(f"{API}/quran/verses/uthmani?chapter_number={surah_id}")
    arabic = {v["verse_key"]: v["text_uthmani"] for v in ar["verses"]}
    verses = [
        {
            "n": v["verse_number"],
            "en": display_text(v["translations"][0]["text"]),
            "ar": arabic[v["verse_key"]].strip(),
        }
        for v in en["verses"]
    ]
    return {"id": surah_id, "verses": verses}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0
    for surah_id in range(1, 115):
        data = build_surah(surah_id)
        (OUT_DIR / f"{surah_id:03d}.json").write_text(
            json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
        total += len(data["verses"])
        print(f"  {surah_id:3d}: {len(data['verses'])} verses")
        time.sleep(0.1)
    print(f"Wrote {total} verses to {OUT_DIR.relative_to(ROOT)}")
    if total != 6236:
        raise SystemExit(f"Expected 6236 verses, got {total}")


if __name__ == "__main__":
    main()
