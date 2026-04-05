"""
compress.py
-----------
Converts all WAV files in ./piper_audiobook_output/ to compressed MP3s,
saving them to ./piper_audiobook_mp3/.

Compression approach
--------------------
  WAV  → MP3 at 48 kbps, mono, 22050 Hz
  Typical reduction: ~95%  (e.g. 155 MB WAV → ~7 MB MP3)

48 kbps mono is the standard bitrate for spoken-word audio (podcasts,
audiobooks). It preserves full speech intelligibility with no perceptible
quality loss.

Usage
-----
    python compress.py                  # convert all 114 Surahs
    python compress.py --bitrate 64     # higher quality (64 kbps)
    python compress.py --bitrate 32     # smaller files (32 kbps)
    python compress.py --workers 4      # parallel jobs (default: CPU count)

Requirements
------------
    ffmpeg must be installed:  brew install ffmpeg
"""

import argparse
import os
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# ---------------------------------------------------------------------------
# Directories
# ---------------------------------------------------------------------------
INPUT_DIR  = Path(__file__).parent / "piper_audiobook_output"
OUTPUT_DIR = Path(__file__).parent / "piper_audiobook_mp3"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def check_ffmpeg() -> str:
    """Return the path to ffmpeg, or exit with instructions."""
    path = shutil.which("ffmpeg")
    if path:
        return path
    print(
        "ERROR: ffmpeg is not installed or not in PATH.\n"
        "  Install it with:  brew install ffmpeg\n"
        "  Then re-run this script.",
        file=sys.stderr,
    )
    sys.exit(1)


def human_size(n_bytes: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n_bytes < 1024:
            return f"{n_bytes:.1f} {unit}"
        n_bytes /= 1024
    return f"{n_bytes:.1f} TB"


def compress_file(
    wav_path: Path,
    mp3_path: Path,
    bitrate: int,
    ffmpeg_bin: str,
) -> tuple[Path, int, int, float]:
    """
    Compress one WAV → MP3.
    Returns (mp3_path, original_bytes, compressed_bytes, elapsed_s).
    """
    if mp3_path.exists():
        return mp3_path, wav_path.stat().st_size, mp3_path.stat().st_size, 0.0

    t0 = time.perf_counter()
    cmd = [
        ffmpeg_bin,
        "-y",                        # overwrite without asking
        "-i", str(wav_path),         # input
        "-ac", "1",                  # force mono
        "-ar", "22050",              # sample rate (match Piper output)
        "-b:a", f"{bitrate}k",       # audio bitrate
        "-codec:a", "libmp3lame",    # MP3 encoder
        "-q:a", "4",                 # VBR quality hint (ignored when -b:a set)
        str(mp3_path),               # output
    ]
    result = subprocess.run(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    elapsed = time.perf_counter() - t0

    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed for {wav_path.name}:\n{result.stderr[-500:]}"
        )

    return mp3_path, wav_path.stat().st_size, mp3_path.stat().st_size, elapsed


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Compress Quran audiobook WAVs to MP3."
    )
    p.add_argument(
        "--bitrate", type=int, default=48,
        help="MP3 bitrate in kbps (default: 48). Try 32 (smaller) or 64 (higher quality).",
    )
    p.add_argument(
        "--workers", type=int, default=os.cpu_count() or 4,
        help="Number of parallel ffmpeg jobs (default: CPU count).",
    )
    p.add_argument(
        "--input-dir", type=Path, default=INPUT_DIR,
        dest="input_dir",
        help="Directory containing WAV files (default: ./piper_audiobook_output/).",
    )
    p.add_argument(
        "--output-dir", type=Path, default=OUTPUT_DIR,
        dest="output_dir",
        help="Destination directory for MP3 files (default: ./piper_audiobook_mp3/).",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    ffmpeg_bin = check_ffmpeg()

    wav_files = sorted(args.input_dir.glob("*.wav"))
    if not wav_files:
        print(f"No WAV files found in {args.input_dir.resolve()}", file=sys.stderr)
        sys.exit(1)

    args.output_dir.mkdir(parents=True, exist_ok=True)

    total_wav = len(wav_files)
    print("=" * 62)
    print("  Quran Audiobook — WAV → MP3 Compressor")
    print("=" * 62)
    print(f"  Input  : {args.input_dir.resolve()}")
    print(f"  Output : {args.output_dir.resolve()}")
    print(f"  Files  : {total_wav} WAVs")
    print(f"  Bitrate: {args.bitrate} kbps mono")
    print(f"  Workers: {args.workers} parallel jobs")
    print("=" * 62)

    # Build job list
    jobs: list[tuple[Path, Path]] = []
    skipped = 0
    for wav in wav_files:
        mp3 = args.output_dir / (wav.stem + ".mp3")
        if mp3.exists():
            skipped += 1
        jobs.append((wav, mp3))

    if skipped:
        print(f"\n  {skipped} file(s) already exist — will be skipped.\n")

    # Track totals
    total_original  = 0
    total_compressed = 0
    completed       = 0
    failed          = 0
    wall_start      = time.perf_counter()

    # Run with thread pool (ffmpeg is the bottleneck — threads are fine)
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(compress_file, wav, mp3, args.bitrate, ffmpeg_bin): wav
            for wav, mp3 in jobs
        }

        for future in as_completed(futures):
            wav_path = futures[future]
            try:
                mp3_path, orig_bytes, comp_bytes, elapsed = future.result()
                total_original   += orig_bytes
                total_compressed += comp_bytes
                completed        += 1
                ratio = (1 - comp_bytes / max(orig_bytes, 1)) * 100
                skipped_label = " (skipped)" if elapsed == 0.0 else f" [{elapsed:.1f}s]"
                print(
                    f"  ✓ [{completed:3d}/{total_wav}] {mp3_path.name:<35}"
                    f"  {human_size(orig_bytes):>8} → {human_size(comp_bytes):>7}"
                    f"  -{ratio:.0f}%{skipped_label}"
                )
            except Exception as exc:
                failed += 1
                print(f"  ✗ {wav_path.name}: {exc}", file=sys.stderr)

    # Summary
    total_wall = time.perf_counter() - wall_start
    savings     = total_original - total_compressed
    pct_saved   = (savings / max(total_original, 1)) * 100

    print()
    print("=" * 62)
    print("  SUMMARY")
    print("=" * 62)
    print(f"  Files compressed : {completed - skipped}")
    print(f"  Files skipped    : {skipped}")
    print(f"  Failed           : {failed}")
    print(f"  Original size    : {human_size(int(total_original))}")
    print(f"  Compressed size  : {human_size(int(total_compressed))}")
    print(f"  Space saved      : {human_size(int(savings))}  ({pct_saved:.1f}%)")
    print(f"  Wall time        : {total_wall:.1f}s")
    print(f"  Output directory : {args.output_dir.resolve()}")
    print("=" * 62)


if __name__ == "__main__":
    main()
