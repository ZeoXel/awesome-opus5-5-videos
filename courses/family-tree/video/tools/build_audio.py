"""Synthesises the whole soundtrack from src/timeline.json — no samples needed.

  * music: a music-box / marimba score at 100 BPM that changes with each act
    (storybook → thinking pulse during 停一停 → clap-along chant → quiz →
    celebration → outro);
  * sound effects: every pop, step, ding and buzz at the exact cue times the
    picture uses;
  * voice-over (optional): if tools/tts.py has produced public/audio/voice/,
    each line is placed at its caption time and the music ducks under it.

Writes public/audio/soundtrack.wav (48 kHz stereo).

    python3 tools/build_audio.py
"""
import json
import math
import pathlib
import subprocess
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
SR = 48000
DUR = TL["duration"]
N = int(DUR * SR) + SR
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


# ----------------------------------------------------------------- music ----
C, Am, F, G = [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]
PROG = [C, Am, F, G]
PENTA = [72, 74, 76, 79, 81, 84]


def windows(key):
    return [(w["t0"], w["t1"]) for w in TL.get(key, [])]


def in_any(t, wins, pad=0.0):
    return any(a - pad <= t < b + pad for a, b in wins)


def build_music():
    mus = np.zeros(N)
    pauses = [(c["t0"], c["t0"] + c["dur"]) for c in TL["countdowns"]]
    chant = TL["chant"]
    quiz_t0 = TL["quiz"][0]["t0"] - 1
    bar_i = 0
    t = 0.6
    melody_seed = np.random.default_rng(3)
    while t < DUR - 1.5:
        chord = PROG[bar_i % 4]
        section = (
            "chant" if chant["t0"] - 0.1 <= t < chant["t1"] else
            "wide" if 209 <= t < chant["t0"] else
            "quiz" if quiz_t0 <= t < TL["stars"]["t0"] else
            "outro" if t >= TL["stars"]["t0"] else
            "story"
        )
        # pad under everything
        place(mus, t, pad([midi(m - 12) for m in chord], BAR + 0.3), 0.05 if section != "chant" else 0.035)
        for b in range(4):
            tb = t + b * BEAT
            if in_any(tb, pauses, 0.1):
                # thinking pulse only: low heartbeat under the ticks
                if b % 2 == 0:
                    place(mus, tb, pluck(midi(chord[0] - 24), 0.4), 0.18)
                continue
            if section in ("story", "outro", "quiz"):
                if b in (0, 2):
                    place(mus, tb, pluck(midi(chord[0] - 12 if b == 0 else chord[2] - 24), 0.5), 0.22)
                # sparse music-box melody: a gentle random walk on the pentatonic scale
                if section != "quiz" or b % 2 == 0:
                    for half in (0, 0.5):
                        if melody_seed.random() < (0.55 if half == 0 else 0.25):
                            note = PENTA[int(melody_seed.integers(0, len(PENTA)))]
                            if note % 12 not in [m % 12 for m in chord] and melody_seed.random() < 0.6:
                                note = chord[int(melody_seed.integers(0, 3))] + 12
                            place(mus, tb + half * BEAT, music_box(midi(note), 1.0), 0.16 if section != "quiz" else 0.11)
            elif section == "wide":
                if b == 0:
                    place(mus, tb, music_box(midi(chord[0] + 12), 2.0), 0.14)
                    place(mus, tb + BEAT * 1.5, music_box(midi(chord[2] + 12), 2.0), 0.1)
            elif section == "chant":
                place(mus, tb, pluck(midi(chord[0] - 24), 0.35), 0.28 if b % 2 == 0 else 0.16)
                if b % 2 == 1:
                    place(mus, tb, sfx_clap(), 0.9)
        t += BAR
        bar_i += 1
    # chant melody follows the lyric syllables (same timing rule as the picture)
    contour = [79, 79, 76, 76, 72, 74, 76, 76, 79, 81, 79, 76, 74, 72, 74, 76, 72]
    for line in chant["lines"]:
        k = 0
        for ch, tc in chant_chars(line["text"], line["t"]):
            if ch in "，；。":
                continue
            place(mus, tc, marimba(midi(contour[k % len(contour)]), 0.5), 0.32)
            k += 1
    # count-in claps
    for b in range(4):
        place(mus, chant["t0"] + b * BEAT, sfx_clap(), 1.0)
    return mus


def chant_chars(text, t0):
    out, phrase, j = [], 0, 0
    for ch in text:
        if ch in "「」『』":
            continue
        punct = ch in "，；。"
        out.append((ch, t0 + (phrase * 4 + max(0, j - (1 if punct else 0)) * 0.5) * BEAT))
        if punct:
            phrase, j = phrase + 1, 0
        else:
            j += 1
    return out


def build_sfx():
    fx = np.zeros(N)
    step_i, mallet_i, tick_i = 0, 0, 0
    last = {"step": -9, "mallet": -9}
    for cue in TL["sfx"]:
        name, t, g = cue["name"], cue["t"], cue["gain"]
        if name == "step":
            step_i = step_i + 1 if t - last["step"] < 2.5 else 0
            last["step"] = t
            s = sfx_step(step_i)
        elif name == "mallet":
            mallet_i = mallet_i + 1 if t - last["mallet"] < 2.0 else 0
            last["mallet"] = t
            s = sfx_mallet(mallet_i)
        elif name == "tick":
            s = sfx_tick(tick_i)
            tick_i += 1
        else:
            s = SFX[name]()
        place(fx, t, s, 0.45 * g)
    return fx


def load_voice():
    """Returns (voice track, list of active windows) if tts.py has run."""
    vdir = ROOT / "public" / "audio" / "voice"
    manifest = vdir / "manifest.json"
    if not manifest.exists():
        return None, []
    vo = np.zeros(N)
    active = []
    for item in json.loads(manifest.read_text()):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(vdir / item["file"]), "-f", "f32le",
                              "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
        s = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
        place(vo, item["t"], s, 1.0)
        active.append((item["t"], item["t"] + len(s) / SR))
    return vo, active


def duck_curve(active, depth=0.35):
    g = np.ones(N)
    for a, b in active:
        i0, i1 = int((a - 0.15) * SR), int((b + 0.25) * SR)
        g[max(0, i0):i1] = depth
    # smooth the gain changes (~120 ms)
    k = int(0.12 * SR)
    kernel = np.ones(k) / k
    return np.convolve(g, kernel, mode="same")


def main():
    mus = build_music()
    fx = build_sfx()
    vo, active = load_voice()
    if vo is not None:
        mix = mus * duck_curve(active) * 0.9 + fx * 0.8 + vo * 1.0
    else:
        mix = mus * 1.0 + fx * 1.0
    # fade out the last two seconds
    tail = int(2.0 * SR)
    end = int(DUR * SR)
    mix[end - tail:end] *= np.linspace(1, 0, tail)
    mix[end:] = 0
    mix = mix[:end]
    # simple soft clip + normalise to −1 dBFS peak; loudness is finished by ffmpeg loudnorm at render
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
    stereo = np.stack([mix, mix], axis=1)
    out = ROOT / "public" / "audio" / "soundtrack.wav"
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((stereo * 32767).astype("<i2").tobytes())
    rms = 20 * math.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9)
    print(f"wrote {out.relative_to(ROOT)}: {DUR:.0f}s, voice={'yes' if vo is not None else 'no'}, RMS {rms:.1f} dBFS")


if __name__ == "__main__":
    main()
