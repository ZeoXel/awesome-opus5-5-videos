"""Scores 《豆豆拜年记》: writes public/audio/ep1.wav … ep3.wav from src/episodes/*.json.

  * music per shot: festive New-Year bounce, a soft music box for the height
    checks and the album, and the family song to the traditional 两只老虎 tune;
  * every sound cue in the episode file (pops, knocks, poofs, stickers …);
  * "voices": each speech bubble gets a little gibberish voice — one blip per
    character, each character pitched differently — the way cartoon animals
    talk. Teachers read the bubbles aloud.

    python3 tools/build_audio.py
"""
import json
import math
import pathlib
import sys
import wave

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from synth import (SR, env, lowpass, marimba, midi, music_box, noise, pad, pluck, sfx_boing, sfx_buzz,  # noqa: E402
                   sfx_chime, sfx_clap, sfx_ding, sfx_dingdong, sfx_fanfare, sfx_flip, sfx_land, sfx_pop,
                   sfx_rise, sfx_sparkle, sfx_whoosh, tone)

ROOT = pathlib.Path(__file__).resolve().parent.parent
rng = np.random.default_rng(11)

# base pitch (Hz) and wobble of each character's cartoon voice
VOICE = {
    "me": (520, 1.0), "yeye": (170, 0.6), "nainai": (300, 0.7), "bobo": (150, 0.9), "baba": (190, 0.8),
    "shushu": (240, 1.1), "gugu": (330, 0.9), "tangge": (420, 1.0), "biaomei": (620, 1.2), "waigong": (165, 0.6),
    "waipo": (310, 0.8), "mama": (320, 0.8), "jiujiu": (140, 0.9), "yima": (350, 1.0), "biaojie": (480, 1.0),
    "biaodi": (600, 1.2),
}


def place(buf, t, s, gain=1.0):
    i = int(t * SR)
    if i < 0 or i >= len(buf):
        return
    s = s[: len(buf) - i]
    buf[i:i + len(s)] += s * gain


def cat(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


# ------------------------------------------------------------ extra sfx ----
def sweep(f0, f1, dur, shape=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (t / dur) ** shape
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise_burst(dur, cut, a=0.002, d=0.05):
    n = int(dur * SR)
    y = lowpass(noise(dur), cut)
    y = y / (np.abs(y).max() + 1e-9)
    return y * env(n, a, d, 4)


EXTRA = {
    "foot": lambda: tone(140, 0.08, ((1, 1),), a=0.001, d=0.02, curve=6) * 0.5,
    "crack": lambda: noise_burst(0.12, 6000, d=0.03) * 0.8,
    "boing": lambda: sfx_boing(True),
    "page": lambda: noise_burst(0.35, 3000, a=0.05, d=0.1) * 0.5,
    "knock": lambda: cat(tone(180, 0.18, ((1, 1), (2.3, 0.5)), a=0.001, d=0.03, curve=6), noise_burst(0.05, 2500, d=0.01) * 0.4),
    "creak": lambda: sweep(220, 330, 0.7) * env(int(0.7 * SR), 0.05, 0.4, 2) * 0.25,
    "whistle": lambda: (np.sin(2 * np.pi * np.cumsum(2400 + 120 * np.sign(np.sin(np.arange(int(0.7 * SR)) / SR * 2 * np.pi * 18))) / SR)
                        * env(int(0.7 * SR), 0.01, 0.6, 1.5) * 0.35),
    "skate": lambda: noise_burst(2.2, 900, a=0.1, d=1.2) * 0.5,
    "cheer": lambda: cat(*(noise_burst(1.2, 2200 + 300 * k, a=0.1, d=0.5) * 0.25 for k in range(3)), sfx_chime() * 0.6),
    "poof": lambda: noise_burst(0.6, 1500, a=0.01, d=0.25) * 0.9,
    "huh": lambda: sfx_boing(True),
    "shutter": lambda: cat(noise_burst(0.06, 7000, d=0.01), np.concatenate([np.zeros(int(0.07 * SR)), noise_burst(0.06, 5000, d=0.01)])) * 0.8,
    "bounce": lambda: cat(*(np.concatenate([np.zeros(int(k * 0.32 * SR)), tone(110, 0.15, ((1, 1),), a=0.001, d=0.05) * (0.8 - k * 0.2)]) for k in range(3))),
    "sticker": lambda: cat(sweep(600, 1400, 0.35) * env(int(0.35 * SR), 0.01, 0.3, 1.5) * 0.25, np.concatenate([np.zeros(int(0.75 * SR)), sfx_pop()])),
    "chip": lambda: marimba(midi(84), 0.4) * 0.5,
    "squeak": lambda: sweep(700, 1100, 0.3) * env(int(0.3 * SR), 0.02, 0.2, 2) * 0.3,
    "thud": lambda: tone(80, 0.3, ((1, 1),), a=0.001, d=0.08, curve=5) * 0.9,
    "flop": lambda: cat(noise_burst(0.3, 1200, d=0.1), tone(100, 0.25, ((1, 1),), a=0.001, d=0.06)) * 0.5,
    "rustle": lambda: noise_burst(1.6, 4000, a=0.2, d=0.8) * 0.35,
    "pop": sfx_pop,
    "sparkle": sfx_sparkle,
    "whoosh": sfx_whoosh,
    "land": sfx_land,
    "ding": sfx_ding,
    "dingdong": sfx_dingdong,
    "rise": sfx_rise,
    "fanfare": sfx_fanfare,
    "buzz": sfx_buzz,
    "car": lambda: (lowpass(noise(3.0), 300) * 0.0 + np.sin(2 * np.pi * np.cumsum(70 + 8 * np.sin(np.arange(int(3 * SR)) / SR * 30)) / SR)
                    * env(int(3 * SR), 0.3, 2.0, 1) * 0.25),
    "slam": lambda: cat(tone(160, 0.3, ((1, 1), (2.6, 0.4)), a=0.001, d=0.05, curve=6), noise_burst(0.1, 3000, d=0.02) * 0.5) * 0.5,
    "whee": lambda: sweep(400, 1100, 0.9, 0.7) * env(int(0.9 * SR), 0.02, 0.7, 1.2) * 0.3,
    "dizzy": lambda: cat(*(np.concatenate([np.zeros(int(k * 0.18 * SR)), music_box(midi(88 - k * 2), 0.5) * 0.3]) for k in range(6))),
    "candy": lambda: cat(*(np.concatenate([np.zeros(int(rng.uniform(0, 0.6) * SR)), tone(rng.uniform(1800, 3200), 0.12, ((1, 1),), a=0.001, d=0.03) * 0.3]) for _ in range(14))),
    "beep": lambda: tone(1320, 0.18, ((1, 1),), a=0.002, d=0.1, curve=3) * 0.4,
    "sneeze": lambda: cat(sweep(500, 900, 0.5) * env(int(0.5 * SR), 0.3, 0.2, 2) * 0.15,
                          np.concatenate([np.zeros(int(0.45 * SR)), noise_burst(0.45, 5000, a=0.005, d=0.2)])),
    "stamp": lambda: cat(tone(90, 0.3, ((1, 1),), a=0.001, d=0.06), noise_burst(0.12, 2000, d=0.03)),
    "firework": lambda: cat(sweep(300, 1500, 0.6) * 0.08, np.concatenate([np.zeros(int(0.6 * SR)), noise_burst(0.9, 3000, a=0.002, d=0.4)])),
    "mallet": lambda: marimba(midi(79), 0.7) * 0.7,
}


# ----------------------------------------------------------------- voices --
def voice_line(who, text, dur):
    """Gibberish speech: one pitched blip per character, phrase-final fall."""
    base, wob = VOICE.get(who, (300, 1.0))
    chars = [c for c in text if c not in "，。！？…、—～\n「」『』“”？！ "]
    if not chars:
        return np.zeros(1)
    per = min(0.16, max(0.09, (dur - 0.2) / len(chars)))
    out = np.zeros(int((per * len(chars) + 0.3) * SR))
    for i, c in enumerate(chars):
        n = int(per * 0.9 * SR)
        t = np.arange(n) / SR
        contour = 1 + 0.18 * wob * math.sin(i * 1.7 + ord(c) % 7) - (0.15 if i == len(chars) - 1 else 0)
        f = base * contour * (1 + 0.05 * np.sin(2 * np.pi * 7 * t))
        ph = 2 * np.pi * np.cumsum(f) / SR
        vowel = (ord(c) % 5) / 5
        y = np.sin(ph) + (0.5 - 0.3 * vowel) * np.sin(2 * ph) + 0.25 * vowel * np.sin(3 * ph)
        y *= np.sin(np.pi * t / (n / SR)) ** 0.6
        i0 = int(i * per * SR)
        out[i0:i0 + n] += y[: len(out) - i0]
    if text.endswith(("？", "?")):
        out *= 1.0
    return out / (np.abs(out).max() + 1e-9) * 0.5


# ------------------------------------------------------------------ music --
C, Am, F, G = [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]
PROG = [C, F, G, C]
PENTA = [72, 74, 76, 79, 81]


def woodblock(hi=True):
    return tone(1200 if hi else 900, 0.08, ((1, 1), (2.4, 0.3)), a=0.0005, d=0.02, curve=6) * 0.6


def music_for(style, t0, t1, mus, seed):
    r = np.random.default_rng(seed)
    if style == "song":
        return
    bpm = {"festive": 112, "calm": 92, "soft": 92}[style]
    beat = 60 / bpm
    bar = 4 * beat
    t, i = t0 + 0.05, 0
    while t < t1 - 0.2:
        chord = PROG[i % 4]
        place(mus, t, pad([midi(m - 12) for m in chord], min(bar + 0.3, t1 - t + 0.2)), 0.05)
        for b in range(4):
            tb = t + b * beat
            if tb > t1 - 0.1:
                break
            if style == "festive":
                place(mus, tb, pluck(midi(chord[0] - 12 if b % 2 == 0 else chord[2] - 24), 0.4), 0.22)
                place(mus, tb + beat / 2, woodblock(b % 2 == 0), 0.18)
                for h in (0, 0.5):
                    if r.random() < (0.6 if h == 0 else 0.35):
                        note = PENTA[int(r.integers(0, len(PENTA)))]
                        place(mus, tb + h * beat, marimba(midi(note), 0.5), 0.2)
            else:
                if b in (0, 2):
                    place(mus, tb, pluck(midi(chord[0] - 12), 0.6), 0.15)
                if r.random() < 0.55:
                    place(mus, tb, music_box(midi(PENTA[int(r.integers(0, len(PENTA)))]), 1.2), 0.14)
        t += bar
        i += 1


def song_music(song, mus):
    beat = 60 / song["bpm"]
    t0 = song["bars"][0]["t"]
    # count-in claps
    for k in range(4):
        place(mus, t0 - (4 - k) * beat, sfx_clap(), 0.9)
    chords = [C, C, C, C, C, G, C, C]  # per bar of the tune
    for i, b in enumerate(song["bars"]):
        ch = chords[i % 8]
        place(mus, b["t"], pad([midi(m - 12) for m in ch], 4 * beat + 0.2), 0.05)
        for k in range(4):
            tb = b["t"] + k * beat
            place(mus, tb, pluck(midi(ch[0] - 24 if k % 2 == 0 else ch[2] - 24), 0.35), 0.28)
            if k % 2 == 1:
                place(mus, tb, sfx_clap(), 0.7)
        for nt in b["notes"]:
            place(mus, nt["t"], marimba(midi(nt["m"] + 12), max(0.35, nt["d"] * 0.9)), 0.42)
            place(mus, nt["t"], music_box(midi(nt["m"] + 12), max(0.5, nt["d"])), 0.18)


def build(ep_file):
    ep = json.loads(ep_file.read_text())
    dur = ep["duration"]
    n = int((dur + 1) * SR)
    mus, fx, vo = np.zeros(n), np.zeros(n), np.zeros(n)
    for k, m in enumerate(ep["music"]):
        music_for(m["style"], m["t0"], m["t1"], mus, seed=k * 7 + len(ep["id"]))
    if ep.get("song"):
        song_music(ep["song"], mus)
    for c in ep["sfx"]:
        place(fx, c["t"], EXTRA[c["name"]](), 0.5 * c["gain"])
    who_of = {a["id"]: a["who"] for a in ep["actors"]}
    talk = []
    for b in ep["bubbles"]:
        who = who_of.get(b["who"], "me" if b["who"] != "all" else None)
        if who is None:  # everyone shouts 茄子
            for k, w in enumerate(("bobo", "gugu", "me", "yeye", "biaomei")):
                place(vo, b["t0"] + 0.1 + k * 0.02, voice_line(w, b["text"], b["t1"] - b["t0"]), 0.35)
        else:
            place(vo, b["t0"] + 0.12, voice_line(who, b["text"], b["t1"] - b["t0"]), 0.55)
        talk.append((b["t0"], b["t1"]))
    # duck the music a little while someone talks
    g = np.ones(n)
    for a, b in talk:
        g[int(a * SR):int(b * SR)] = 0.6
    k = int(0.15 * SR)
    g = np.convolve(g, np.ones(k) / k, mode="same")
    mix = mus * g + fx + vo
    end = int(dur * SR)
    tail = int(1.2 * SR)
    mix[end - tail:end] *= np.linspace(1, 0, tail)
    mix = mix[:end]
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
    out = ROOT / "public" / "audio" / f"{ep['id']}.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.stack([mix, mix], 1) * 32767).astype("<i2").tobytes())
    rms = 20 * math.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9)
    print(f"wrote {out.relative_to(ROOT)}: {dur:.0f}s, RMS {rms:.1f} dBFS")


if __name__ == "__main__":
    for f in sorted((ROOT / "src" / "episodes").glob("ep*.json")):
        build(f)
