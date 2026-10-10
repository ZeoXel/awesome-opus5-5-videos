"""Small synthesiser shared by the soundtrack builder: instruments and sound effects,
all generated from sine waves and noise (no samples)."""
import json
import math
import pathlib
import subprocess
import wave

import numpy as np

SR = 48000
BEAT = 60 / 100
BAR = 4 * BEAT
rng = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.005, d=0.3, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * np.maximum(0, t - a) / max(d, 1e-4))
    return e


def tone(f, dur, partials=((1, 1),), a=0.004, d=0.4, curve=4.0, vib=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * f * t
    if vib:
        ph += vib * np.sin(2 * np.pi * 5.5 * t)
    y = sum(amp * np.sin(ph * k) for k, amp in partials)
    return y * env(n, a, d, curve)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def lowpass(x, cutoff):
    # one-pole low-pass, cutoff may be an array (sweeps)
    a = np.exp(-2 * np.pi * np.asarray(cutoff) / SR) * np.ones_like(x)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def music_box(f, dur=1.2):
    return tone(f, dur, ((1, 1), (2, 0.25), (3, 0.12), (4.2, 0.05)), d=dur * 0.45, curve=3)


def marimba(f, dur=0.6):
    return tone(f, dur, ((1, 1), (4, 0.3), (10, 0.05)), a=0.002, d=0.18, curve=5)


def pluck(f, dur=0.5):
    return tone(f, dur, ((1, 1), (2, 0.5), (3, 0.2)), a=0.003, d=0.12, curve=5)


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
    return y * e / len(freqs)


# ------------------------------------------------------------------ sfx ----
def sfx_pop():
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 380
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.05)


def sfx_whoosh(dur=0.7):
    n = int(dur * SR)
    t = np.arange(n) / SR
    cut = 300 + 3000 * np.sin(np.pi * t / dur) ** 2
    y = lowpass(noise(dur), cut)
    y = y * np.sin(np.pi * t / dur) ** 2
    return y / (np.abs(y).max() + 1e-9) * 0.5


def sfx_slide():
    return sfx_whoosh(2.6) * 0.8


def sfx_step(i):
    scale = [72, 74, 76, 79, 81, 84, 86]
    return music_box(midi(scale[i % len(scale)]), 0.5) * 0.6


def sfx_land():
    knock = tone(220, 0.25, ((1, 1), (2.7, 0.4)), a=0.001, d=0.05, curve=6)
    thud = tone(90, 0.25, ((1, 1),), a=0.001, d=0.08, curve=5)
    return knock * 0.7 + thud * 0.6


def sfx_ding(f=midi(88)):
    return tone(f, 1.4, ((1, 1), (2.76, 0.3), (5.4, 0.1)), d=0.5, curve=3) * 0.6


def sfx_dingdong():
    out = np.zeros(int(1.6 * SR))
    for k, m in enumerate((84, 88, 91)):
        s = sfx_ding(midi(m)) * 0.7
        i = int(k * 0.11 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out


def sfx_buzz():
    out = np.zeros(int(0.7 * SR))
    for k, f in enumerate((180, 150)):
        n = int(0.24 * SR)
        t = np.arange(n) / SR
        sq = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * t) * 0.5
        s = lowpass(sq, 1600) * env(n, 0.005, 0.2, 2)
        i = int(k * 0.26 * SR)
        out[i:i + n] += s
    return out * 0.7


def sfx_rise():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = 300 * 2 ** (t / 0.6 * 1.5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.6) * 0.35


def sfx_boing(up=True):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    f = (300 + 260 * t / 0.55) if up else (520 - 300 * t / 0.55)
    f = f * (1 + 0.06 * np.sin(2 * np.pi * 14 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.35, 2) * 0.55


def sfx_flip():
    n = int(0.25 * SR)
    y = lowpass(noise(0.25), 5000) * env(n, 0.002, 0.04, 6)
    return y * 0.6


def sfx_tick(i=0):
    return tone(2200 if i % 2 == 0 else 1700, 0.08, ((1, 1),), a=0.0005, d=0.012, curve=6) * 0.7


def sfx_chime():
    out = np.zeros(int(2.0 * SR))
    for k, m in enumerate((79, 84, 86, 91, 96)):
        s = music_box(midi(m), 1.4) * 0.35
        i = int(k * 0.07 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out


def sfx_sparkle():
    out = np.zeros(int(2.2 * SR))
    for k in range(9):
        m = 88 + int(rng.integers(0, 12))
        s = music_box(midi(m), 0.9) * 0.22
        i = int(rng.uniform(0, 1.2) * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out / (np.abs(out).max() + 1e-9) * 0.4


def sfx_sweep_up():
    out = np.zeros(int(1.6 * SR))
    for k, m in enumerate((72, 74, 76, 79, 81, 84, 86, 88)):
        s = marimba(midi(m), 0.5) * 0.4
        i = int(k * 0.05 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out


def sfx_mallet(i):
    scale = [67, 69, 72, 74, 76, 79, 81, 84, 86, 88]
    return marimba(midi(scale[i % len(scale)]), 0.7) * 0.7


def sfx_doorbell():
    out = np.zeros(int(2.2 * SR))
    for k, m in enumerate((76, 72)):
        s = tone(midi(m), 1.6, ((1, 1), (2, 0.2), (3, 0.08)), d=0.7, curve=2.5) * 0.6
        i = int(k * 0.55 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    return out


def sfx_fanfare():
    out = np.zeros(int(2.6 * SR))
    for k, m in enumerate((72, 76, 79, 84, 88)):
        s = music_box(midi(m), 1.6) * 0.5
        low = marimba(midi(m - 12), 0.6) * 0.3
        s[: len(low)] += low
        i = int(k * 0.12 * SR)
        out[i:i + len(s)] += s[: len(out) - i]
    sp = sfx_sparkle()[: len(out)]
    out[: len(sp)] += sp * 0.8
    return out


def sfx_clap():
    n = int(0.12 * SR)
    y = noise(0.12)
    y = y - lowpass(y, 900)
    e = np.zeros(n)
    for k in range(3):
        i = int(k * 0.01 * SR)
        e[i:] += env(n - i, 0.0005, 0.02, 5)
    y = y * e
    return y / (np.abs(y).max() + 1e-9) * 0.45


SFX = {
    "pop": sfx_pop, "whoosh": sfx_whoosh, "slide": sfx_slide, "land": sfx_land, "ding": sfx_ding,
    "dingdong": sfx_dingdong, "buzz": sfx_buzz, "rise": sfx_rise, "huh": lambda: sfx_boing(True),
    "oops": lambda: sfx_boing(False), "flip": sfx_flip, "chime": sfx_chime, "sparkle": sfx_sparkle,
    "sweep_up": sfx_sweep_up, "doorbell": sfx_doorbell, "fanfare": sfx_fanfare,
}


def place(buf, t, s, gain=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    s = s[: len(buf) - i]
    buf[i:i + len(s)] += s * gain


