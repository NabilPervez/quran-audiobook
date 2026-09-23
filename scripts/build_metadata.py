"""
build_metadata.py
-----------------
Builds sacred-stream/src/data/catalog.json: per-surah metadata (names,
meaning, revelation place, verse count, audio duration) and the Juz map.

Data sources
  - Quran.com v4 API  /chapters and /juzs
  - Local MP3 files    sacred-stream/public/audio/*.mp3  (duration via mutagen)

Usage
    pip install requests mutagen
    python scripts/build_metadata.py
"""

import json
import sys
from pathlib import Path

import requests
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from extract_text import SURAH_NAMES  # noqa: E402  (filename slugs)

API = "https://api.quran.com/api/v4"
AUDIO_DIR = ROOT / "sacred-stream" / "public" / "audio"
OUT = ROOT / "sacred-stream" / "src" / "data" / "catalog.json"


def get(path: str) -> dict:
    resp = requests.get(f"{API}{path}", timeout=30)
    resp.raise_for_status()
    return resp.json()


def build_juzs() -> list[dict]:
    # The endpoint returns duplicate rows; keep one per juz_number.
    by_number = {}
    for j in get("/juzs")["juzs"]:
        by_number.setdefault(j["juz_number"], j)
    juzs = []
    for number in sorted(by_number):
        surahs = []
        for surah_id, verse_range in by_number[number]["verse_mapping"].items():
            start, end = (int(x) for x in verse_range.split("-"))
            surahs.append({"id": int(surah_id), "from": start, "to": end})
        juzs.append({"juz": number, "surahs": sorted(surahs, key=lambda s: s["id"])})
    return juzs


def main() -> None:
    chapters = get("/chapters?language=en")["chapters"]
    juzs = build_juzs()
    juz_start = {}
    for j in juzs:
        for s in j["surahs"]:
            if s["from"] == 1:
                juz_start[s["id"]] = j["juz"]

    surahs = []
    for c in chapters:
        mp3 = AUDIO_DIR / f"{c['id']:03d}_{SURAH_NAMES[c['id']]}.mp3"
        if not mp3.exists():
            sys.exit(f"Missing audio file: {mp3}")
        surahs.append({
            "id": c["id"],
            "nameTranslit": c["name_simple"],
            "nameArabic": c["name_arabic"],
            "meaning": c["translated_name"]["name"],
            "revelation": "meccan" if c["revelation_place"] == "makkah" else "medinan",
            "verseCount": c["verses_count"],
            "durationSec": round(MP3(mp3).info.length, 2),
            "audioUrl": f"/audio/{mp3.name}",
            "juzStart": juz_start[c["id"]],
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps({"surahs": surahs, "juzs": juzs}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    total_h = sum(s["durationSec"] for s in surahs) / 3600
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(surahs)} surahs, {len(juzs)} juz, {total_h:.1f} h audio")


if __name__ == "__main__":
    main()
