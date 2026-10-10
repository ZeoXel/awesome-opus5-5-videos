"""《一张红纸》timeline — built from the measured voice-over durations.

Every visual event (cut, unfold, tag, strip, glow, camera move) is placed
relative to the spoken lines, so changing a line re-times the whole film.
Writes src/paper/film.json, read by the Remotion film and by paper_audio.py.

    python3 tools/paper_voice.py && python3 tools/paper_timeline.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = json.loads((ROOT / "public" / "audio" / "paper" / "manifest.json").read_text())

# ------------------------------------------------------------ world layout --
S = 0.8                      # figure scale on the sheet
SP = 270                     # spacing between siblings in a paper-doll chain
GY, CY, KY = -430, 40, 560   # feet of grandparents / parents' generation / children
ME = (0, 560)                # 我 stands on the fold
LEFT = {"cx": -900, "grand": ["yeye", "nainai"], "chain": ["bobo", "baba", "shushu", "gugu"]}
RIGHT = {"cx": 900, "grand": ["waigong", "waipo"], "chain": ["mama", "jiujiu", "yima"]}


def chain_x(side, who):
    ch = side["chain"]
    return side["cx"] + (ch.index(who) - (len(ch) - 1) / 2) * SP


def grand_x(side, who):
    return side["cx"] + (side["grand"].index(who) - 0.5) * SP * 0.95


POS = {}
for side in (LEFT, RIGHT):
    for w in side["grand"]:
        POS[w] = [grand_x(side, w), GY]
    for w in side["chain"]:
        POS[w] = [chain_x(side, w), CY]
KIDS = {"tangge": "shushu", "biaomei": "gugu", "biaojie": "jiujiu", "biaodi": "yima"}
for k, parent in KIDS.items():
    POS[k] = [POS[parent][0], KY]
POS["me"] = list(ME)

film = {"world": {"S": S, "SP": SP, "GY": GY, "CY": CY, "KY": KY, "pos": POS, "kids": KIDS,
                  "left": LEFT, "right": RIGHT},
        "lines": [], "ev": {}, "cam": [], "sfx": [], "music": [], "silence": []}
ev = film["ev"]


def sfx(t, name, gain=1.0, **kw):
    film["sfx"].append({"t": round(t, 3), "name": name, "gain": gain, **kw})


def say(id_, t):
    """Places a line at t; returns its end time. Subtitle stays ≥ chars/4.5+1.5 s."""
    v = VOICE[id_]
    n = len([c for c in v["text"] if c not in "，。？！、；“”"])
    show = max(v["dur"] + 0.6, n / 4.5 + 1.5)
    film["lines"].append({"id": id_, "who": v["voice"], "text": v["text"], "t0": round(t, 3),
                          "dur": v["dur"], "show": round(show, 3)})
    return t + v["dur"]


def cam(t, x, y, z):
    film["cam"].append([round(t, 3), x, y, z])


def name_time(t0, id_):
    """The name comes at the end of the answer: ≈ 72 % through the line."""
    return t0 + VOICE[id_]["dur"] * 0.72


# ---------------------------------------------------------------- S0 hook --
t = 0.0
cam(0, ME[0], ME[1] - 120, 1.7)
sfx(0.6, "snip", 1.0)
ev["fadein"] = 0.3
ev["me_drop"] = 0.9
sfx(1.75, "tap", 0.8)

# ------------------------------------------------------------------ S1 我 --
t = 2.4
cam(2.4, ME[0], ME[1] - 120, 1.7)
end = say("hello", t)
cam(end + 0.6, -700, -150, 0.6)        # pull back: the folded sheet on the table
film["music"].append({"t0": 2.4, "t1": None, "style": "pluck"})
ev["baba"] = end + 0.9                 # 爸爸 is cut out next to the fold
ev["baba_strip"] = ev["baba"] + 0.5
sfx(ev["baba"] - 0.7, "snips", 0.8)
sfx(ev["baba"], "pluck", 0.8, note=0)
t = ev["baba"] + 1.6

# ---------------------------------------------------------- S2 爸爸这边 --
cam(t - 0.6, -900, -400, 0.95)
order_L = [("yeye", "pair_cut"), ("nainai", "unfold"), ("bobo", "unfold"), ("shushu", "unfold"), ("gugu", "unfold")]
notes = {"yeye": 1, "nainai": 2, "bobo": 3, "shushu": 4, "gugu": 5, "waigong": 1, "waipo": 2, "jiujiu": 4, "yima": 5}
for who, how in order_L:
    if who == "bobo":
        cam(t - 0.4, -900, -170, 1.05)       # down to the parents' generation
    q = say(f"q_{who}", t)
    if how == "pair_cut":
        ev["yeye_cut"] = t + 0.2
        sfx(t + 0.2, "snips", 0.8)
    a0 = q + 0.35
    end = say(f"a_{who}", a0)
    ev[who] = name_time(a0, f"a_{who}")
    sfx(ev[who] - 0.15, "unfold" if how == "unfold" else "lift", 0.9)
    sfx(ev[who], "pluck", 0.9, note=notes[who])
    sfx(ev[who] + 0.3, "tap", 0.5)
    if who == "nainai":
        ev["grand_strip_L"] = end + 0.2
        sfx(end + 0.2, "paper", 0.5)
    t = end + 1.0
ev["overview_L"] = t
cam(t, -900, -170, 0.62)
t += 1.6

# ---------------------------------------------------------- S3 妈妈这边 --
ev["flip"] = t
sfx(t, "flip", 1.0)
cam(t + 1.6, 900, -170, 0.62)
ev["mama"] = t + 1.7
sfx(ev["mama"] - 0.6, "snips", 0.8)
sfx(ev["mama"], "pluck", 0.8, note=0)
ev["mama_strip"] = ev["mama"] + 0.5
t = ev["mama"] + 1.4
cam(t - 0.5, 900, -400, 0.95)
for who, how in [("waigong", "pair_cut"), ("waipo", "unfold"), ("jiujiu", "unfold"), ("yima", "unfold")]:
    if who == "jiujiu":
        cam(t - 0.4, 900, -170, 1.05)
    q = say(f"q_{who}", t)
    if how == "pair_cut":
        ev["waigong_cut"] = t + 0.2
        sfx(t + 0.2, "snips", 0.8)
    a0 = q + 0.35
    end = say(f"a_{who}", a0)
    ev[who] = name_time(a0, f"a_{who}")
    sfx(ev[who] - 0.15, "unfold" if how == "unfold" else "lift", 0.9)
    sfx(ev[who], "pluck", 0.9, note=notes[who])
    sfx(ev[who] + 0.3, "tap", 0.5)
    if who == "waipo":
        ev["grand_strip_R"] = end + 0.2
        sfx(end + 0.2, "paper", 0.5)
    t = end + 1.0
cam(t, 0, -150, 0.5)                  # the whole sheet
t += 1.2

# ------------------------------------------------- silence ① then S4 kids --
film["silence"].append([t, t + 1.5])
t += 1.5
for kid in ("tangge", "biaomei", "biaojie", "biaodi"):
    px = POS[kid][0]
    # frame the parent, the child and 我 together; keep the bottom clear for the caption
    cx = (px + ME[0]) / 2
    z = min(1.0, 1700 / (abs(px - ME[0]) + 700))
    cam(t - 0.1, cx, -230 + 500 / z, z)    # parents' heads at the top, children's tags above the caption
    ev[f"{kid}_cut"] = t + 0.5
    sfx(t + 0.5, "snips", 0.8)
    a0 = t + 0.9
    end = say(f"k_{kid}", a0)
    ev[kid] = a0 + 0.35                 # dropped in while "叔叔的儿子…" is said
    ev[f"{kid}_cmp"] = a0 + VOICE[f"k_{kid}"]["dur"] * 0.42   # …比我大
    ev[f"{kid}_tag"] = a0 + VOICE[f"k_{kid}"]["dur"] * 0.85   # …堂哥
    sfx(ev[kid], "tap", 0.8)
    sfx(ev[kid] + 0.1, "paper", 0.5)
    sfx(ev[f"{kid}_cmp"], "rise", 0.6)
    sfx(ev[f"{kid}_tag"], "pluck", 0.9, note=6 if kid.startswith("tang") else 7)
    ev[f"{kid}_end"] = end + 0.6
    t = end + 1.1

# ------------------------------------------------------------- S5 rules --
cam(t - 0.3, 0, -150, 0.5)
t += 0.5
for q_id, a_id, key in (("q_tang", "a_tang", "glow_tang"), ("q_biao", "a_biao", "glow_biao"), ("q_order", "a_order", "badges")):
    q = say(q_id, t)
    a0 = q + 0.4
    end = say(a_id, a0)
    ev[key] = a0 + VOICE[a_id]["dur"] * (0.5 if key == "badges" else 0.75)
    sfx(ev[key], "chime", 0.7)
    t = end + 1.1
ev["rules_end"] = t

# ---------------------------------------------- silence ② then S6 native move --
film["silence"].append([t, t + 2.0])
t += 2.0
ev["fold"] = t                         # the right half closes over the left …
sfx(t, "fold", 1.0)
ev["unfold_sheet"] = t + 1.6           # … and opens again
sfx(t + 1.6, "fold", 0.8)
ev["flow"] = t + 3.0                   # light runs down both strips into 我
sfx(t + 3.0, "shimmer", 0.8)
t = t + 4.0
end = say("same", t)
ev["window"] = end + 0.6               # the sheet goes up onto the window: backlit 窗花
sfx(ev["window"], "window", 0.8)
cam(t - 0.2, 0, 380, 1.1)
cam(ev["window"], 0, 380, 1.1)
t = ev["window"] + 3.2

# --------------------------------------------------------------- S7 close --
end1 = say("bye_c", t)
say("bye_t", t + 0.02)
ev["wave"] = t
sfx(end1 + 1.2, "snip", 0.9)          # the same snip that opened the film
film["duration"] = round(end1 + 2.6, 2)
film["music"][0]["t1"] = film["silence"][0][0]
film["music"].append({"t0": film["silence"][0][1] + 0.4, "t1": film["silence"][1][0], "style": "pluck"})
film["music"].append({"t0": ev["flow"] - 0.2, "t1": film["duration"], "style": "warm"})

OUT = ROOT / "src" / "paper" / "film.json"
OUT.write_text(json.dumps(film, ensure_ascii=False, indent=1))
print(f"film.json: {film['duration']}s, {len(film['lines'])} lines, {len(film['sfx'])} sound cues")
