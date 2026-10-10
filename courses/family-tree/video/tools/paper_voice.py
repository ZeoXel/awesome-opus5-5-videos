"""Generates the voice-over for 《一张红纸》 with index-tts-v2 (voice cloning).

Each line → public/audio/paper/<id>.wav (48 kHz mono, slowed 15 % for young
listeners, pitch kept), plus manifest.json with the durations the timeline is
built from. Existing files are kept, so re-running only fills gaps; delete a
file to regenerate that line.

The API key is injected by the environment's network proxy; MOZIA_API_KEY is
sent as well when it is set locally.

    python3 tools/paper_voice.py
"""
import base64
import json
import os
import pathlib
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from paper_lines import LINES  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "paper"
REF = {v: base64.b64encode((ROOT / "tools" / "voice_ref" / f).read_bytes()).decode()
       for v, f in (("T", "ref_teacher.wav"), ("C", "ref_child.wav"))}
API = "https://mzsjai.com/v1/audio/speech"
TEMPO = 0.85  # ≈ 4 characters per second


def synth(voice, text, out):
    body = json.dumps({"model": "index-tts-v2", "input": text, "ref_audio": REF[voice]}, ensure_ascii=False)
    raw = OUT / "raw" / out.name
    raw.parent.mkdir(exist_ok=True)
    if not raw.exists():
        fetch(body, raw)
    process(raw, out)


def fetch(body, raw):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        f.write(body)
    cmd = ["curl", "-sS", "--fail-with-body", "-m", "120", "-X", "POST", API, "-H", "Content-Type: application/json",
           "-d", f"@{f.name}", "-o", str(raw)]
    if os.environ.get("MOZIA_API_KEY"):
        cmd[1:1] = ["-H", f"Authorization: Bearer {os.environ['MOZIA_API_KEY']}"]
    for attempt in range(3):
        if subprocess.run(cmd).returncode == 0:
            break
    else:
        raise SystemExit(f"TTS failed for {raw.name}")


def process(raw, out):
    """Raw TTS (cached in raw/) → slowed, trimmed, normalised line."""
    # slow down a little, trim silence at both ends, normalise to −3 dBFS peak
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
                    f"silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo={TEMPO},loudnorm=I=-18:TP=-3",
                    "-ar", "48000", "-ac", "1", str(out)], check=True)


def duration(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for id_, voice, text in LINES:
        out = OUT / f"{id_}.wav"
        if not out.exists():
            synth(voice, text, out)
            print(f"  generated {id_}: {text}")
        manifest[id_] = {"voice": voice, "text": text, "dur": round(duration(out), 3)}
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
    total = sum(m["dur"] for m in manifest.values())
    print(f"{len(manifest)} lines, {total:.1f}s of speech")


if __name__ == "__main__":
    main()
