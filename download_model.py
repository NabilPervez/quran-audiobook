"""
download_model.py
-----------------
Pre-flight script: downloads the en_GB-alan-medium Piper voice model
and its JSON config from the Hugging Face piper-voices repository into
the local ./voices/ directory. Safe to re-run — skips files that already
exist.
"""

import sys
from pathlib import Path
import urllib.request

# ---------------------------------------------------------------------------
# Voice model files hosted on Hugging Face
# ---------------------------------------------------------------------------
BASE_URL = (
    "https://huggingface.co/rhasspy/piper-voices/resolve/main"
    "/en/en_GB/alan/medium"
)

VOICE_FILES = [
    "en_GB-alan-medium.onnx",
    "en_GB-alan-medium.onnx.json",
]

VOICES_DIR = Path(__file__).parent / "voices"


def download_file(url: str, dest: Path) -> None:
    """Download *url* to *dest*, showing a progress indicator."""
    print(f"  Downloading {dest.name} …", end=" ", flush=True)
    headers = {"User-Agent": "quran-audiobook/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response, open(dest, "wb") as out_file:
        total = int(response.headers.get("Content-Length", 0))
        downloaded = 0
        chunk = 8192
        while True:
            data = response.read(chunk)
            if not data:
                break
            out_file.write(data)
            downloaded += len(data)
            if total:
                pct = downloaded / total * 100
                print(f"\r  Downloading {dest.name} … {pct:.1f}%", end="", flush=True)
    print(f"\r  ✓ {dest.name} saved ({downloaded / 1_048_576:.1f} MB)")


def ensure_voice_model() -> Path:
    """Download model files if absent. Returns the path to the .onnx file."""
    VOICES_DIR.mkdir(parents=True, exist_ok=True)

    for filename in VOICE_FILES:
        dest = VOICES_DIR / filename
        if dest.exists():
            print(f"  ✓ {filename} already present — skipping.")
        else:
            url = f"{BASE_URL}/{filename}"
            download_file(url, dest)

    onnx_path = VOICES_DIR / "en_GB-alan-medium.onnx"
    if not onnx_path.exists():
        print("ERROR: ONNX model not found after download attempt.", file=sys.stderr)
        sys.exit(1)

    return onnx_path


if __name__ == "__main__":
    print("=== Piper Voice Model Downloader ===")
    print(f"Voices directory: {VOICES_DIR.resolve()}\n")
    model = ensure_voice_model()
    print(f"\nModel ready: {model.resolve()}")
