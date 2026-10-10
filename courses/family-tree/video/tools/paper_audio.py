"""《一张红纸》soundtrack: voice-over + paper sound design + plucked score.

  * voices: public/audio/paper/<id>.wav placed at their timeline times;
  * paper sounds (snip, rustle, unfold, fold, tap) synthesised from noise;
  * plucked-string notes (Karplus–Strong, 古琴 / 琵琶-like) on the pentatonic
    scale — one on every name, pitch rising with each relative;
  * a light pluck-and-woodblock score that stops dead for the two silences,
    and a warm pad for the ending; music ducks under the voices.

Writes public/audio/paper/mix.wav. Loudness (−14 LUFS) is finished at render.

    python3 tools/paper_audio.py
"""
import json
import pathlib
import subprocess
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
F = json.loads((ROOT / "src" / "paper" / "film.json").read_text())
VO = ROOT / "public" / "audio" / "paper"
SR = 48000
N = int((F["duration"] + 1) * SR)
rng = np.random.default_rng(5)
PENTA = [0, 2, 4, 7, 9]  # 宫商角徵羽


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf, t, s, g=1.0):
    i = int(t * SR)
    if 0 <= i < len(buf):
        s = s[: len(buf) - i]
        buf[i:i + len(s)] += s * g


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4))


def bandnoise(dur, lo, hi):
    n = int(dur * SR)
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(spec, n)
    return y / (np.abs(y).max() + 1e-9)


def pluck(freq, dur=2.2, bright=0.5, decay=0.996):
    """Karplus–Strong, computed one period at a time (fast in numpy)."""
    n = int(dur * SR)
    P = max(2, int(SR / freq))
    y = np.zeros(n + P)
    burst = rng.uniform(-1, 1, P)
    # a softer pluck: low-pass the excitation
    for _ in range(int(3 * (1 - bright)) + 1):
        burst = 0.5 * (burst + np.roll(burst, 1))
    y[:P] = burst
    for start in range(P, n + P, P):
        prev = y[start - P:start]
        nxt = decay * 0.5 * (prev + np.concatenate([[prev[-1]], prev[:-1]]))
        y[start:start + P] = nxt[: len(y[start:start + P])]
    out = y[P:P + n]
    out *= np.exp(-np.arange(n) / SR / (dur * 0.5))
    return out / (np.abs(out).max() + 1e-9)


def note(idx, octave=0):
    m = 60 + 12 * octave + PENTA[idx % 5] + 12 * (idx // 5)
    return midi(m)


# ------------------------------------------------------------------ sfx ----
def snip():
    click = bandnoise(0.05, 2500, 9000) * env(int(0.05 * SR), 0.0005, 0.008)
    ring = np.sin(2 * np.pi * 4200 * np.arange(int(0.08 * SR)) / SR) * env(int(0.08 * SR), 0.0005, 0.02) * 0.25
    out = np.zeros(int(0.1 * SR))
    out[: len(click)] += click
    out[: len(ring)] += ring
    return out * 0.9


def snips(k=5, gap=0.17):
    out = np.zeros(int((k * gap + 0.2) * SR))
    for i in range(k):
        s = snip() * (0.75 + 0.25 * rng.random())
        place(out, i * gap + rng.uniform(-0.02, 0.02) + 0.02, s)
    return out


def rustle(dur, lo=1500, hi=7000, a=0.15):
    n = int(dur * SR)
    y = bandnoise(dur, lo, hi)
    shape = np.sin(np.pi * np.arange(n) / n) ** 1.5
    crackle = (rng.random(n) < 0.004) * rng.uniform(0.5, 1, n)
    return (y * shape * 0.5 + crackle * 0.6 * shape) * a / 0.15


def tap():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * 180 * t) * env(n, 0.001, 0.02)
    return thump * 0.6 + bandnoise(0.12, 800, 3000) * env(n, 0.001, 0.01) * 0.3


def chime():
    out = np.zeros(int(2.5 * SR))
    for i, m in enumerate((84, 88, 91, 96)):
        n = int(2.2 * SR)
        t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * midi(m) * t) + 0.3 * np.sin(2 * np.pi * midi(m) * 2.76 * t)) * env(n, 0.002, 0.6)
        place(out, i * 0.07, s, 0.25)
    return out


def shimmer():
    out = np.zeros(int(3 * SR))
    for i in range(14):
        m = 84 + PENTA[i % 5] + 12 * (i // 10)
        place(out, i * 0.08, pluck(midi(m), 1.5, 0.9, 0.997), 0.18)
    return out


def rise():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 500 * 2 ** (t / 0.6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.6) * 0.25


SFX = {
    "snip": snip, "snips": snips, "tap": tap, "chime": chime, "shimmer": shimmer, "rise": rise,
    "lift": lambda: rustle(0.35, 2000, 8000, 0.1),
    "unfold": lambda: rustle(0.55, 1200, 7000, 0.2),
    "paper": lambda: rustle(0.5, 1500, 6000, 0.08),
    "flip": lambda: rustle(1.4, 800, 6000, 0.22),
    "fold": lambda: rustle(1.2, 600, 5000, 0.22),
    "window": lambda: rustle(1.0, 400, 2500, 0.12),
}


def build_music(mus):
    beat = 60 / 76
    for m in F["music"]:
        t0, t1, style = m["t0"], m["t1"], m["style"]
        t, i = t0, 0
        while t < t1 - 0.3:
            if style == "pluck":
                if i % 4 == 0:
                    place(mus, t, pluck(note(rng.integers(0, 5), -1), 2.4, 0.3), 0.16)
                if i % 2 == 1 and rng.random() < 0.7:
                    place(mus, t, pluck(note(rng.integers(5, 10)), 1.4, 0.5), 0.09)
                if i % 4 == 2:
                    wb = np.sin(2 * np.pi * 900 * np.arange(int(0.06 * SR)) / SR) * env(int(0.06 * SR), 0.0005, 0.012)
                    place(mus, t, wb, 0.12)
            elif style == "warm":
                if i % 4 == 0:
                    n = int(min(4 * beat + 0.8, t1 - t + 0.5) * SR)
                    tt = np.arange(n) / SR
                    pad = sum(np.sin(2 * np.pi * midi(m_) * tt) for m_ in (55, 62, 67, 71))
                    pad *= np.minimum(1, tt / 0.8) * np.minimum(1, (n / SR - tt) / 0.8) / 4
                    place(mus, t, pad, 0.08)
                if i % 2 == 0:
                    place(mus, t, pluck(note(rng.integers(3, 9)), 2.0, 0.4), 0.12)
            t += beat
            i += 1


def main():
    voice = np.zeros(N)
    fx = np.zeros(N)
    mus = np.zeros(N)
    talk = np.zeros(N)
    for ln in F["lines"]:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(VO / f"{ln['id']}.wav"), "-f", "f32le", "-ac", "1",
                              "-ar", str(SR), "-"], capture_output=True, check=True).stdout
        s = np.frombuffer(raw, np.float32).astype(float)
        place(voice, ln["t0"], s, 1.0 if ln["id"] != "bye_t" else 0.8)
        i0, i1 = int((ln["t0"] - 0.1) * SR), int((ln["t0"] + ln["dur"] + 0.2) * SR)
        talk[max(0, i0):i1] = 1
    for c in F["sfx"]:
        if c["name"] == "pluck":
            s = pluck(note(c.get("note", 0) + 5), 2.2, 0.6)
            place(fx, c["t"], s, 0.32 * c["gain"])
        else:
            place(fx, c["t"], SFX[c["name"]](), 0.5 * c["gain"])
    build_music(mus)
    for a, b in F["silence"]:
        i0, i1 = int(a * SR), int(b * SR)
        mus[i0:i1] = 0
        fx[i0:i1] *= 0.0
    k = int(0.2 * SR)
    duck = 1 - 0.45 * np.convolve(talk, np.ones(k) / k, mode="same")
    mix = voice + fx * 0.9 + mus * duck
    mix = np.tanh(mix * 1.05) / np.tanh(1.05)
    end = int(F["duration"] * SR)
    mix = mix[:end]
    mix[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))
    mix /= np.abs(mix).max() + 1e-9
    mix *= 0.89
    out = VO / "mix.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.stack([mix, mix], 1) * 32767).astype("<i2").tobytes())
    print(f"wrote {out.relative_to(ROOT)}: {F['duration']}s")


if __name__ == "__main__":
    main()
