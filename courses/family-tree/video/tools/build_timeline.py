"""Builds src/timeline.json — the single source of truth for every time point.

The Remotion composition reads it for visuals, build_audio.py reads it for
music, sound effects and (optional) voice-over, so picture and sound can't
drift apart. All times are in seconds.

    python3 tools/build_timeline.py
"""
import json
import pathlib

FPS = 30
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "timeline.json"

# ---------------------------------------------------------------- layout ----
# World coordinates: (x, y) is the centre of a person's photo card.
# Rows: grandparents / parents' generation / children.
R1, R2, R3 = 150, 455, 760
MX = 2400  # the mother's page sits to the right of the father's page

POS = {
    # 爸爸这边
    "yeye": (580, R1), "nainai": (810, R1),
    "bobo": (230, R2), "baba": (540, R2), "shushu": (850, R2), "gugu": (1160, R2),
    "tangjie": (230, R3), "me": (540, R3), "tangge": (850, R3), "biaomei": (1160, R3),
    # 妈妈这边
    "waigong": (MX + 525, R1), "waipo": (MX + 755, R1),
    "mama": (MX + 300, R2), "jiujiu": (MX + 640, R2), "yima": (MX + 980, R2),
    "biaojie": (MX + 530, R3), "jiudi": (MX + 750, R3), "biaodi": (MX + 980, R3),
}

CAM_FATHER = dict(x=960, y=540, s=1)
CAM_MOTHER = dict(x=MX + 960, y=540, s=1)
CAM_INTRO = dict(x=2160, y=540, s=1)
CAM_WIDE = dict(x=1800, y=560, s=0.5)
CAM_BOTH = dict(x=1800, y=760, s=0.5)
CAM_CHANT = dict(x=1800, y=990, s=0.5)  # lifts the tree so the lyrics fit underneath

INTRO = {"me": (2160, 650, 1.5), "baba": (1830, 300, 1), "mama": (2490, 300, 1)}

tl = {
    "fps": FPS,
    "acts": [],
    "camera": {"init": CAM_INTRO, "moves": []},
    "nodes": {},
    "edges": [],
    "walks": [],
    "words": [],
    "compares": [],
    "cakes": [],
    "countdowns": [],
    "captions": [],
    "sfx": [],
    "shakes": [],
    "waves": [],
    "glows": [],
    "tags": [],
}


def act(id_, name, t0, t1):
    tl["acts"].append({"id": id_, "name": name, "t0": t0, "t1": t1})


def cap(t0, t1, text, **kw):
    # 「…」 marks a word printed in the 堂 colour, 『…』 in the 表 colour.
    tl["captions"].append({"t0": t0, "t1": t1, "text": text, **kw})


def sfx(t, name, gain=1.0):
    tl["sfx"].append({"t": round(t, 3), "name": name, "gain": gain})


def cam(t0, t1, target):
    tl["camera"]["moves"].append({"t0": t0, "t1": t1, **target})
    sfx(t0, "whoosh", 0.7)


def node(id_, appear, unknown=False, at=None, ghost=None, pop=True):
    x, y = POS[id_]
    s = 1
    if at:
        x, y, s = at
    tl["nodes"][id_] = {"x": x, "y": y, "s": s, "appear": appear, "unknown": unknown,
                        "moves": [], "ghost": ghost}
    if pop:
        sfx(appear, "pop")


def move(id_, t0, t1, x=None, y=None, s=1):
    if x is None:
        x, y = POS[id_]
    tl["nodes"][id_]["moves"].append({"t0": t0, "t1": t1, "x": x, "y": y, "s": s})


def reveal(id_, t):
    tl["nodes"][id_]["reveal"] = t
    sfx(t, "flip", 0.8)


def edge(parents, children, t0, dur=1.2, hidden=()):
    """hidden: (t0, t1) windows when the line fades out, e.g. while a long
    cross-page line would clutter the view of one page."""
    tl["edges"].append({"parents": parents, "children": children, "t0": t0, "dur": dur,
                        "hidden": [list(w) for w in hidden]})


def walk(route, t0, t1, color, fade, sound=True):
    tl["walks"].append({"route": route, "t0": t0, "t1": t1, "color": color, "fade": fade})
    if sound:
        steps = len(route) - 1
        for i in range(steps + 1):
            sfx(t0 + (t1 - t0) * i / steps, "step", 0.8)


def word(t0, t1, slots, merge=None):
    """slots: list of dicts {i, ch, py, color, t, wrong?}."""
    tl["words"].append({"t0": t0, "t1": t1, "slots": slots, "merge": merge})
    for s in slots:
        sfx(s["t"], "land")
        if s.get("wrong"):
            sfx(s["wrong"], "buzz")
    if merge:
        sfx(merge, "dingdong")


def compare(other, t0, t1, bigger, label_t):
    tl["compares"].append({"a": "me", "b": other, "t0": t0, "t1": t1,
                           "bigger": bigger, "label": label_t})
    sfx(t0 + 0.4, "rise", 0.8)
    sfx(label_t, "ding", 0.7)


def countdown(t0, dur=5):
    tl["countdowns"].append({"t0": t0, "dur": dur})
    for i in range(dur):
        sfx(t0 + i, "tick")
    sfx(t0 + dur, "ding")


# ----------------------------------------------------------- 第 0 幕 片头 ----
act("act0", "片头", 0, 15)
node("me", 0.5, at=INTRO["me"])
tl["waves"].append({"node": "me", "t0": 0.9, "t1": 3.6})
cap(0.4, 4, "大家好，我是“我”！")
tl["silhouettes"] = {"t0": 4.2, "t1": 9.2}
sfx(4.0, "doorbell")
tl["question"] = {"node": "me", "t0": 5.6, "t1": 9.2}
cap(4, 9.3, "过年了，家里来了好多亲戚。他们该怎么叫呢？")
tl["title"] = {"t0": 9.4, "t1": 13.8, "text": "从“我”出发，找家人"}
for i in range(len("从“我”出发，找家人")):
    sfx(9.4 + i * 0.16, "mallet", 0.6)
cap(9.5, 15, "跟我一起，从“我”出发，去找家人吧！")
# two roots grow out of "me": one to the left (爸爸这边), one to the right
node("baba", 15.3, at=INTRO["baba"], ghost=13.6)
node("mama", 16.1, at=INTRO["mama"], ghost=13.6)
edge(["baba"], ["me"], 13.6, 1.5, hidden=[(141.6, 209.4)])
edge(["mama"], ["me"], 13.6, 1.5, hidden=[(24.6, 136.4)])

# ---------------------------------------------------- 第 1 幕 爸爸这边：长辈 ----
act("act1", "爸爸这边：长辈", 15, 66)
cap(15.2, 19.6, "我有爸爸，也有妈妈。")
cap(19.6, 24.2, "家人分成两边：爸爸这边，和妈妈这边。")
tl["sideLabels"] = {"t0": 19.8, "t1": 24.4}
cap(24.2, 28, "先去爸爸这边看看！")
cam(24.4, 27.4, CAM_FATHER)
move("baba", 24.4, 27.4)
move("me", 24.4, 27.4)
move("mama", 24.4, 27.4)

edge(["yeye", "nainai"], ["baba"], 28.0, 1.2)
node("yeye", 28.6)
node("nainai", 32.6)
cap(28, 32.6, "爸爸的爸爸，叫爷爷；")
cap(32.6, 38.2, "爸爸的妈妈，叫奶奶。")

edge(["yeye", "nainai"], ["bobo", "shushu", "gugu"], 38.6, 1.4)
for k in ("bobo", "shushu", "gugu"):
    tl["nodes"].setdefault(k, None)
cap(38.6, 44.2, "爷爷奶奶不只有爸爸一个孩子哦！")

node("bobo", 44.6, ghost=39.4)
tl["cakes"].append({"t0": 45.4, "t1": 52.2, "a": "bobo", "b": "baba", "na": 5, "nb": 4})
tl["tags"].append({"node": "bobo", "t0": 46.2, "t1": 52.2, "text": "比爸爸大"})
sfx(46.2, "ding", 0.6)
cap(44.6, 52.2, "比爸爸大的哥哥，我叫他伯伯。")

node("shushu", 52.6, ghost=39.4)
tl["cakes"].append({"t0": 53.4, "t1": 59.6, "a": "shushu", "b": "baba", "na": 3, "nb": 4})
tl["tags"].append({"node": "shushu", "t0": 54.2, "t1": 59.6, "text": "比爸爸小"})
sfx(54.2, "ding", 0.6)
cap(52.6, 59.6, "比爸爸小的弟弟，我叫他叔叔。")

node("gugu", 60.0, ghost=39.4)
cap(60, 66, "爸爸的姐姐和妹妹，我都叫她姑姑。")
tl["nods"] = [{"t0": 63.6, "nodes": ["yeye", "nainai", "bobo", "baba", "shushu", "gugu"]}]

# ---------------------------------------------------- 第 2 幕 爸爸这边：孩子 ----
act("act2", "爸爸这边：孩子", 66, 134)
edge(["shushu"], ["tangge"], 66.4, 0.8)
node("tangge", 67.0, unknown=True)
sfx(67.6, "huh")
cap(66.5, 73.2, "叔叔家有个男孩。我该叫他什么呢？")

walk(["me", "baba", "GPF", "shushu", "tangge"], 74.0, 79.0, "tang", fade=95.5)
cap(73.4, 83, "从我出发，走到叔叔家。叔叔是爸爸的兄弟，所以是「堂」。")
compare("tangge", 83.0, 95.5, True, 86.0)
cap(83, 89.4, "他比我大，是哥哥。")
word(73.4, 95.5, [
    {"i": 0, "ch": "堂", "py": "táng", "color": "tang", "t": 79.4},
    {"i": 1, "ch": "哥", "py": "gē", "color": "ink", "t": 88.0},
], merge=89.6)
reveal("tangge", 90.0)
cap(89.4, 95.6, "叔叔的儿子比我大，我叫他「堂」哥！")

edge(["gugu"], ["biaomei"], 96.0, 0.8)
node("biaomei", 96.4, unknown=True)
tl["waves"].append({"node": "me", "t0": 98.4, "t1": 102.6, "raise": True})
cap(96, 99.6, "姑姑家的妹妹，我知道！")
cap(99.6, 103, "是……「堂」妹！")
tl["shakes"].append({"t0": 103.0, "dur": 0.5})
sfx(103.6, "oops", 0.8)
walk(["me", "baba", "GPF", "gugu", "biaomei"], 104.6, 109.0, "biao", fade=119)
cap(103, 110.4, "哎呀，说错啦！姑姑是爸爸的姐妹，不是兄弟，所以是『表』。")
compare("biaomei", 110.4, 119.0, False, 112.4)
cap(110.4, 114.2, "她比我小，是妹妹。")
word(99.8, 119.0, [
    {"i": 0, "ch": "堂", "py": "táng", "color": "tang", "t": 100.0, "wrong": 103.0},
    {"i": 1, "ch": "妹", "py": "mèi", "color": "ink", "t": 100.4},
    {"i": 0, "ch": "表", "py": "biǎo", "color": "biao", "t": 109.4},
], merge=114.4)
reveal("biaomei", 114.8)
cap(114.2, 119.2, "姑姑的女儿比我小，我叫她『表』妹。")

# 停一停 ①
edge(["bobo"], ["tangjie"], 119.6, 0.8)
node("tangjie", 120.0, unknown=True)
tl["pauses"] = [{"t0": 119.6, "t1": 133.4}]
sfx(119.6, "chime")
walk(["me", "baba", "GPF", "bobo", "tangjie"], 121.2, 124.4, "tang", fade=133.4)
cap(119.6, 124.6, "停一停！伯伯的女儿比我大，叫什么？")
countdown(124.6)
cap(124.6, 129.6, "大声说出来！")
word(129.6, 133.4, [
    {"i": 0, "ch": "堂", "py": "táng", "color": "tang", "t": 129.6},
    {"i": 1, "ch": "姐", "py": "jiě", "color": "ink", "t": 129.8},
], merge=130.2)
reveal("tangjie", 129.8)
cap(129.6, 133.4, "「堂」姐！你答对了吗？")

# ------------------------------------------------------- 第 3 幕 妈妈这边 ----
act("act3", "妈妈这边", 134, 209)
cap(134, 141.6, "现在去妈妈这边！我还是我，只是换个方向看。")
cam(134.0, 136.4, CAM_WIDE)
# drop below the cousins' row, slide across, then come up under 妈妈
move("me", 136.4, 137.0, POS["me"][0], R3 + 260)
move("me", 137.0, 138.8, POS["mama"][0], R3 + 260)
move("me", 138.8, 139.4, POS["mama"][0], R3)
sfx(136.4, "slide")
cam(139.4, 141.8, CAM_MOTHER)

edge(["waigong", "waipo"], ["mama"], 142.0, 1.2)
node("waigong", 142.6)
node("waipo", 146.4)
cap(142, 146.4, "妈妈的爸爸，叫外公；")
cap(146.4, 150.6, "妈妈的妈妈，叫外婆。")

edge(["waigong", "waipo"], ["jiujiu", "yima"], 150.6, 1.2)
node("jiujiu", 151.2, ghost=151.2)
node("yima", 155.0, ghost=151.6)
cap(150.8, 155, "妈妈的兄弟，叫舅舅；")
cap(155, 159, "妈妈的姐妹，叫姨妈。")

edge(["jiujiu"], ["biaojie"], 159.0, 0.8)
node("biaojie", 159.4, unknown=True)
walk(["me", "mama", "GPM", "jiujiu", "biaojie"], 160.2, 164.6, "biao", fade=173.6)
cap(159.2, 165.6, "舅舅家有个女孩。走一走：舅舅是妈妈的兄弟，也是『表』！")
compare("biaojie", 165.6, 173.6, True, 167.4)
cap(165.6, 169.8, "她比我大，是姐姐。")
word(159.2, 173.6, [
    {"i": 0, "ch": "表", "py": "biǎo", "color": "biao", "t": 165.0},
    {"i": 1, "ch": "姐", "py": "jiě", "color": "ink", "t": 168.8},
], merge=170.0)
reveal("biaojie", 170.4)
cap(169.8, 173.8, "舅舅的女儿比我大，我叫她『表』姐。")

edge(["yima"], ["biaodi"], 174.0, 0.8)
node("biaodi", 174.4, unknown=True)
walk(["me", "mama", "GPM", "yima", "biaodi"], 175.0, 179.2, "biao", fade=187.8)
cap(174, 180, "姨妈家有个男孩，走一走，也是『表』。")
compare("biaodi", 180.0, 187.8, False, 181.6)
cap(180, 183.8, "他比我小，是弟弟。")
word(174.0, 187.8, [
    {"i": 0, "ch": "表", "py": "biǎo", "color": "biao", "t": 179.6},
    {"i": 1, "ch": "弟", "py": "dì", "color": "ink", "t": 183.0},
], merge=184.2)
reveal("biaodi", 184.6)
cap(183.8, 188, "姨妈的儿子比我小，我叫他『表』弟。")

walk(["me", "mama", "GPM", "jiujiu", "biaojie"], 188.4, 190.8, "biao", fade=194.2, sound=False)
walk(["me", "mama", "GPM", "yima", "biaodi"], 188.4, 190.8, "biao", fade=194.2, sound=False)
sfx(188.4, "sparkle")
cap(188.2, 194.4, "妈妈这边的孩子，都叫『表』。")

# 停一停 ②
edge(["jiujiu"], ["jiudi"], 194.6, 0.8)
node("jiudi", 195.0, unknown=True)
tl["pauses"].append({"t0": 194.6, "t1": 208.4})
sfx(194.6, "chime")
walk(["me", "mama", "GPM", "jiujiu", "jiudi"], 196.2, 199.4, "biao", fade=208.4)
cap(194.6, 199.6, "停一停！舅舅的儿子比我小，叫什么？")
countdown(199.6)
cap(199.6, 204.6, "大声说出来！")
word(204.6, 208.4, [
    {"i": 0, "ch": "表", "py": "biǎo", "color": "biao", "t": 204.6},
    {"i": 1, "ch": "弟", "py": "dì", "color": "ink", "t": 204.8},
], merge=205.2)
reveal("jiudi", 204.8)
cap(204.6, 208.4, "『表』弟！你答对了吗？")

# ----------------------------------------------- 第 4 幕 同一个我 + 儿歌 ----
act("act4", "同一个我", 209, 250)
cam(209.0, 212.0, CAM_BOTH)
move("me", 209.6, 212.6, 1930, 1110, 1.5)  # below every label, so both lines reach it cleanly
sfx(209.6, "slide")
tl["glows"].append({"node": "me", "t0": 212.4, "t1": 217.0})
sfx(212.6, "sparkle")
cap(209, 216.8, "爸爸这边，妈妈这边，中间都是同一个我。")
tl["bothLabels"] = {"t0": 210.5, "t1": 227}

for kid, mid in (("tangge", "shushu"), ("tangjie", "bobo")):
    walk(["me", "baba", "GPF", mid, kid], 217.0, 219.6, "tang", fade=227.4, sound=False)
sfx(217.0, "sweep_up")
cap(217, 221.6, "橙色的路，只经过爸爸的兄弟：伯伯和叔叔。")
for kid, mid, parent, gp in (("biaomei", "gugu", "baba", "GPF"), ("biaojie", "jiujiu", "mama", "GPM"),
                             ("jiudi", "jiujiu", "mama", "GPM"), ("biaodi", "yima", "mama", "GPM")):
    walk(["me", parent, gp, mid, kid], 221.6, 224.2, "biao", fade=227.4, sound=False)
sfx(221.6, "sweep_up")
cap(221.6, 227.2, "其他的路，都是青色的『表』。")

BPM = 100
BEAT = 60 / BPM
CHANT_T0 = 228.0
cam(226.8, 228.2, CAM_CHANT)
lines = ["爸爸兄弟家，孩子叫「堂」；", "别的亲戚家，孩子都叫『表』；", "比我大，叫哥姐；", "比我小，叫弟妹。"]
chant = {"t0": CHANT_T0, "bpm": BPM, "lines": []}
t = CHANT_T0 + 4 * BEAT  # one bar of count-in claps
TANG_ROUTES = [["me", "baba", "GPF", "shushu", "tangge"], ["me", "baba", "GPF", "bobo", "tangjie"]]
BIAO_ROUTES = [["me", "baba", "GPF", "gugu", "biaomei"], ["me", "mama", "GPM", "jiujiu", "biaojie"],
               ["me", "mama", "GPM", "jiujiu", "jiudi"], ["me", "mama", "GPM", "yima", "biaodi"]]
for n, line in enumerate(lines):
    chant["lines"].append({"t": round(t, 3), "text": line})
    for route in (TANG_ROUTES if n == 0 else BIAO_ROUTES if n == 1 else []):
        walk(route, t, t + 1.4, "tang" if n == 0 else "biao", fade=t + 8 * BEAT, sound=False)
    cap(t, t + 8 * BEAT, line, chant=True)
    t += 8 * BEAT
chant["t1"] = round(t + 2 * BEAT, 3)
tl["chant"] = chant

# ------------------------------------------------------- 第 5 幕 闯关小测 ----
QUIZ_T0 = 250.0
act("act5", "闯关小测", QUIZ_T0, 300)
quiz = [
    {"chain": ["me", "baba", "gugu"], "kid": {"look": "boy", "H": 236, "shirt": "#6E9E6A"},
     "q": "姑姑的儿子，比我大", "color": "biao", "bigger": True,
     "answer": [("表", "biǎo"), ("哥", "gē")], "why": "姑姑家是『表』，比我大是哥。"},
    {"chain": ["me", "baba", "shushu"], "kid": {"look": "pigtails", "H": 172, "shirt": "#E59AAE"},
     "q": "叔叔的女儿，比我小", "color": "tang", "bigger": False,
     "answer": [("堂", "táng"), ("妹", "mèi")], "why": "叔叔家是「堂」，比我小是妹。"},
    {"chain": ["me", "mama", "yima"], "kid": {"look": "ponytail", "H": 240, "shirt": "#5FA7A0"},
     "q": "姨妈的女儿，比我大", "color": "biao", "bigger": True,
     "answer": [("表", "biǎo"), ("姐", "jiě")], "why": "姨妈家是『表』，比我大是姐。"},
]
tl["quiz"] = []
for n, qz in enumerate(quiz):
    q0 = QUIZ_T0 + 1.0 + n * 16.2
    qz = dict(qz, t0=q0, t1=q0 + 16, n=n + 1)
    qz["answer"] = [{"ch": c, "py": p} for c, p in qz["answer"]]
    tl["quiz"].append(qz)
    sfx(q0, "chime")
    for i in range(4):
        sfx(q0 + 0.8 + i * 0.6, "pop", 0.7)
    sfx(q0 + 3.6, "sweep_up", 0.8)
    cap(q0, q0 + 6, f"第{n + 1}关！{qz['q']}，叫什么？")
    countdown(q0 + 6)
    cap(q0 + 6, q0 + 11, "大声说出来！")
    sfx(q0 + 11.2, "rise", 0.8)
    sfx(q0 + 11.0, "dingdong")
    a = qz["answer"]
    mark = "「{}」" if qz["color"] == "tang" else "『{}』"
    cap(q0 + 11, q0 + 16, mark.format(a[0]["ch"]) + a[1]["ch"] + "！" + qz["why"])

# ------------------------------------------------- 第 6 幕 复习 + 回家任务 ----
act("act6", "复习与回家任务", 300, 322)
tl["stars"] = {"t0": 299.0, "t1": 302.6}
sfx(299.4, "fanfare")
cap(299.4, 302.6, "三关全过，你真棒！")
REVIEW = [("堂", "táng", "tang"), ("表", "biǎo", "biao"), ("哥", "gē", "ink"),
          ("姐", "jiě", "ink"), ("弟", "dì", "ink"), ("妹", "mèi", "ink")]
tl["review"] = {"t0": 302.6, "t1": 314.4,
                "cards": [{"ch": c, "py": p, "color": col, "t": 304.0 + i * 1.6}
                          for i, (c, p, col) in enumerate(REVIEW)]}
for c in tl["review"]["cards"]:
    sfx(c["t"], "mallet", 0.9)
cap(302.6, 314.4, "「堂」、『表』、哥、姐、弟、妹，我们一起读一读。")
tl["ending"] = {"t0": 314.4, "t1": 322.0}
tl["waves"].append({"node": "ending", "t0": 315.0, "t1": 319.0})
cap(314.6, 321.4, "回家问问爸爸妈妈，画一画你的家庭树吧！")

tl["duration"] = 322.0
tl["nodes"] = {k: v for k, v in tl["nodes"].items() if v}
tl["sfx"].sort(key=lambda e: e["t"])
tl["captions"].sort(key=lambda e: e["t0"])
OUT.write_text(json.dumps(tl, ensure_ascii=False, indent=1))
print(f"wrote {OUT.relative_to(OUT.parent.parent)}: {tl['duration']}s, "
      f"{len(tl['captions'])} captions, {len(tl['sfx'])} sound cues")
