"""
main.py
-------
Orchestrates the Clear Quran audiobook generation pipeline:

  1. Download the Alan voice model (if not already present).
  2. Load the PiperVoice model once.
  3. Iterate over all 114 Surahs, synthesise each to a .wav file.
  4. Skip already-generated files (safe to pause/resume mid-run).

Usage
-----
    python main.py                          # generate all 114 Surahs
    python main.py --start 2 --end 10       # generate a specific range
    python main.py --start 1 --end 1        # single Surah (useful for testing)
    python main.py --speed 0.9             # slightly slower narration
"""

import argparse
import os
import sys
import time
import wave
from datetime import timedelta
from pathlib import Path

# --- local modules ---
from download_model import ensure_voice_model
from extract_text import get_quran_data

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
OUTPUT_DIR = Path(__file__).parent / "piper_audiobook_output"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Generate a Clear Quran English audiobook with Piper TTS."
    )
    p.add_argument("--start",  type=int, default=1,   help="First Surah number (1–114)")
    p.add_argument("--end",    type=int, default=114, help="Last Surah number (1–114)")
    p.add_argument(
        "--speed",
        type=float,
        default=1.0,
        help="Narration speed (length_scale): <1 = faster, >1 = slower. Default 1.0",
    )
    p.add_argument(
        "--sentence-silence",
        type=float,
        default=0.35,
        dest="sentence_silence",
        help="Seconds of silence inserted between sentences (default 0.35).",
    )
    p.add_argument(
        "--noise-scale",
        type=float,
        default=0.667,
        dest="noise_scale",
        help="Generator noise — adds slight naturalness variation (default 0.667).",
    )
    p.add_argument(
        "--noise-w",
        type=float,
        default=0.8,
        dest="noise_w",
        help="Phoneme width noise scale (default 0.8).",
    )
    return p.parse_args()


# ---------------------------------------------------------------------------
# Core synthesis helper
# ---------------------------------------------------------------------------
def synthesise_surah(
    voice,
    surah_num: int,
    surah_slug: str,
    text: str,
    output_path: Path,
    speed: float,
    sentence_silence: float,
    noise_scale: float,
    noise_w: float,
) -> float:
    """
    Synthesise *text* to *output_path* using *voice*.
    Returns elapsed seconds.

    The installed piper-tts version uses:
      voice.synthesize(text, syn_config) -> Iterable[AudioChunk]
    Each AudioChunk has .audio_int16_bytes for raw 16-bit PCM.
    """
    from piper.config import SynthesisConfig  # type: ignore

    syn_config = SynthesisConfig(
        length_scale=speed,
        noise_scale=noise_scale,
        noise_w_scale=noise_w,
    )

    t0 = time.perf_counter()
    with wave.open(str(output_path), "wb") as wav_file:
        wav_file.setnchannels(1)          # mono
        wav_file.setsampwidth(2)          # 16-bit PCM
        wav_file.setframerate(voice.config.sample_rate)
        for chunk in voice.synthesize(text, syn_config):
            wav_file.writeframes(chunk.audio_int16_bytes)
    elapsed = time.perf_counter() - t0
    return elapsed


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    args = parse_args()

    if not (1 <= args.start <= args.end <= 114):
        print("ERROR: --start and --end must satisfy 1 ≤ start ≤ end ≤ 114.", file=sys.stderr)
        sys.exit(1)

    # ------------------------------------------------------------------
    # Step 1: Ensure voice model is present
    # ------------------------------------------------------------------
    print("=" * 60)
    print("  Clear Quran Audiobook Generator — Piper TTS (Alan GB)")
    print("=" * 60)
    print("\n[1/3] Checking voice model …")
    model_path = ensure_voice_model()
    print(f"      Model: {model_path}\n")

    # ------------------------------------------------------------------
    # Step 2: Load PiperVoice (once — avoids repeated I/O overhead)
    # ------------------------------------------------------------------
    print("[2/3] Loading PiperVoice model …")
    try:
        from piper import PiperVoice  # type: ignore
    except ImportError:
        print(
            "ERROR: piper-tts is not installed.\n"
            "       Run:  pip install piper-tts",
            file=sys.stderr,
        )
        sys.exit(1)

    voice = PiperVoice.load(str(model_path), use_cuda=False)
    print(f"      Sample rate: {voice.config.sample_rate} Hz\n")

    # ------------------------------------------------------------------
    # Step 3: Synthesis loop
    # ------------------------------------------------------------------
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    total_surahs  = args.end - args.start + 1
    completed     = 0
    skipped       = 0
    total_audio_s = 0.0
    total_wall_s  = 0.0

    print(f"[3/3] Synthesising Surahs {args.start}–{args.end} …")
    print(f"      Output directory: {OUTPUT_DIR.resolve()}\n")

    generation_start = time.perf_counter()

    for surah_num, surah_slug, text in get_quran_data(start=args.start, end=args.end):
        output_file = OUTPUT_DIR / f"{surah_num:03d}_{surah_slug}.wav"

        if output_file.exists():
            print(f"  [{surah_num:03d}/{args.end:03d}] ✓ {output_file.name} (already exists — skipped)")
            skipped += 1
            continue

        if not text.strip():
            print(f"  [{surah_num:03d}/{args.end:03d}] ⚠ {surah_slug}: empty text, skipping.", file=sys.stderr)
            skipped += 1
            continue

        word_count = len(text.split())
        print(f"  [{surah_num:03d}/{args.end:03d}] ▶ {surah_slug} ({word_count:,} words) … ", end="", flush=True)

        elapsed = synthesise_surah(
            voice=voice,
            surah_num=surah_num,
            surah_slug=surah_slug,
            text=text,
            output_path=output_file,
            speed=args.speed,
            sentence_silence=args.sentence_silence,
            noise_scale=args.noise_scale,
            noise_w=args.noise_w,
        )

        # Estimate audio duration from WAV file size
        file_bytes = output_file.stat().st_size
        # bytes = frames × channels × sample_width → frames / sample_rate = duration
        audio_duration_s = (file_bytes - 44) / (voice.config.sample_rate * 1 * 2)  # mono, 16-bit
        total_audio_s += audio_duration_s
        total_wall_s  += elapsed
        completed     += 1

        rtf = elapsed / max(audio_duration_s, 0.001)   # real-time factor
        print(
            f"done  ({timedelta(seconds=int(audio_duration_s))} audio, "
            f"{elapsed:.1f}s wall, RTF {rtf:.2f}x)"
        )

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    total_elapsed = time.perf_counter() - generation_start
    print()
    print("=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    print(f"  Surahs generated : {completed}")
    print(f"  Surahs skipped   : {skipped}")
    print(f"  Total audio      : {timedelta(seconds=int(total_audio_s))}")
    print(f"  Total wall time  : {timedelta(seconds=int(total_elapsed))}")
    if total_audio_s > 0 and total_wall_s > 0:
        print(f"  Overall RTF      : {(total_wall_s / total_audio_s):.2f}x (lower is faster)")
    print(f"  Output directory : {OUTPUT_DIR.resolve()}")
    print("=" * 60)


if __name__ == "__main__":
    main()
