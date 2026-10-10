"""Optional voice-over: synthesises every caption with Microsoft Edge TTS.

Run this on a computer with internet access (the cloud sandbox this project
was built in could not reach the speech service), then rebuild audio:

    pip install edge-tts
    python3 tools/tts.py                      # default voice: a child-friendly female voice
    python3 tools/tts.py --voice zh-CN-XiaoyiNeural --rate -8%
    python3 tools/build_audio.py              # mixes the voice in and ducks the music
    node tools/render.mjs --acts

Each line is written to public/audio/voice/NNN.mp3 and listed with its start
time in manifest.json. Lines that run longer than their caption slot are
reported so you can slow the edit down or speed the voice up.
"""
import argparse
import asyncio
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
OUT = ROOT / "public" / "audio" / "voice"


def speakable(text: str) -> str:
    # drop colour markup; read “我” as a word
    return re.sub(r"[「」『』]", "", text).replace("……", "，")


async def main(voice: str, rate: str):
    import edge_tts

    OUT.mkdir(parents=True, exist_ok=True)
    manifest, too_long = [], []
    for i, cap in enumerate(TL["captions"]):
        if cap.get("chant"):
            continue  # the chant is clapped and read along by the class
        if cap["text"] == "大声说出来！":
            continue  # leave the countdown silent for the children to answer
        f = OUT / f"{i:03d}.mp3"
        await edge_tts.Communicate(speakable(cap["text"]), voice, rate=rate).save(str(f))
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                    "-of", "csv=p=0", str(f)], capture_output=True, text=True).stdout)
        slot = cap["t1"] - cap["t0"]
        if dur > slot:
            too_long.append(f'{cap["t0"]:.1f}s “{cap["text"]}” {dur:.1f}s > {slot:.1f}s')
        manifest.append({"file": f.name, "t": cap["t0"] + 0.1, "text": cap["text"]})
        print(f"{cap['t0']:6.1f}s  {dur:4.1f}s  {cap['text']}")
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
    if too_long:
        print("\nLines longer than their slot (try --rate +10% or lengthen the beat in build_timeline.py):")
        print("\n".join(too_long))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="zh-CN-XiaoxiaoNeural")
    ap.add_argument("--rate", default="-5%")
    a = ap.parse_args()
    asyncio.run(main(a.voice, a.rate))
