"""《豆豆拜年记》— builds src/episodes/ep1.json … ep3.json.

Every shot, character move, speech bubble, gag, sticker and sound cue of the
three episodes is written here, in seconds. The Remotion components draw from
these files and tools/build_audio.py scores them, so picture and sound share
one clock.

    python3 tools/episodes.py
"""
import json
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "episodes"
GROUND = 930
S = 1.55  # default character scale in story scenes
ORANGE = "#EE8A2E"   # 兄弟足球队 jersey — 堂
TEAL = "#3FA3A6"     # 表 kids' coats


class Ep:
    def __init__(self, id_, title, duration):
        self.d = {"id": id_, "title": title, "duration": duration, "shots": [], "actors": [],
                  "bubbles": [], "captions": [], "chips": [], "words": [], "stickers": [],
                  "fx": [], "sfx": [], "music": []}
        self._actors = {}

    # --- structure -------------------------------------------------------
    def shot(self, t0, t1, bg, music=None, **p):
        self.d["shots"].append({"t0": t0, "t1": t1, "bg": bg, "p": p})
        if music:
            self.d["music"].append({"t0": t0, "t1": t1, "style": music})
        if self.d["shots"][:-1]:
            self.sfx(t0, "whoosh", 0.5)

    def actor(self, id_, who, t0, t1, at, s=S, flip=False, **kw):
        a = {"id": id_, "who": who, "show": [t0, t1], "keys": [[t0, at, GROUND, s, flip]],
             "poses": [], "costume": [], "skate": [], **kw}
        if isinstance(at, (list, tuple)):
            a["keys"] = [[t0, at[0], at[1], s, flip]]
        self.d["actors"].append(a)
        self._actors[id_] = a
        return a

    def move(self, id_, t, x, y=None, s=None, flip=None, dur=None):
        """Adds a keyframe at t (the move runs from the previous key to t)."""
        a = self._actors[id_]
        last = a["keys"][-1]
        if dur is not None:  # hold the last pose until t - dur
            a["keys"].append([t - dur, *last[1:]])
            last = a["keys"][-1]
        a["keys"].append([t, x, last[2] if y is None else y, last[3] if s is None else s,
                          last[4] if flip is None else flip])

    def walk_in(self, id_, t0, t1, x, sound=True):
        self.move(id_, t1, x, dur=t1 - t0)
        if sound:
            for k in range(int((t1 - t0) / 0.28)):
                self.sfx(t0 + k * 0.28, "foot", 0.35)

    def pose(self, id_, t0, t1, kind):
        self._actors[id_]["poses"].append([t0, t1, kind])

    def wear(self, id_, t, **costume):
        self._actors[id_]["costume"].append([t, costume])

    # --- words on screen -------------------------------------------------
    def say(self, who, t0, t1, text, at=None):
        b = {"t0": t0, "t1": t1, "who": who, "text": text}
        if at:
            b["at"] = at
        self.d["bubbles"].append(b)

    def cap(self, t0, t1, text):
        # 「…」 = 堂 colour, 『…』 = 表 colour
        self.d["captions"].append({"t0": t0, "t1": t1, "text": text})

    def chip(self, who, t0, t1, x, y=170, tag=None):
        self.d["chips"].append({"who": who, "t0": t0, "t1": t1, "x": x, "y": y, "tag": tag})
        self.sfx(t0, "chip", 0.8)

    def word(self, t0, t1, slots, merge=None):
        self.d["words"].append({"t0": t0, "t1": t1, "merge": merge, "slots": [
            {"i": i, "ch": ch, "py": py, "color": col, "t": t} for i, ch, py, col, t in slots]})
        for *_, t in slots:
            self.sfx(t, "land")
        if merge:
            self.sfx(merge, "dingdong")

    def sticker(self, t, who, src, page="L"):
        self.d["stickers"].append({"t": t, "who": who, "from": src, "page": page})
        self.sfx(t, "sticker")

    def fx(self, kind, t0, t1, **kw):
        self.d["fx"].append({"kind": kind, "t0": t0, "t1": t1, **kw})

    def sfx(self, t, name, gain=1.0):
        self.d["sfx"].append({"t": round(t, 3), "name": name, "gain": gain})

    def shift(self, after, dt):
        """Pushes every time point at or after `after` later by dt seconds
        (makes room for a new beat without retyping the rest of the episode)."""
        T = {"t", "t0", "t1", "merge", "label", "cross", "lit", "full", "reveal"}
        sh = lambda v: v + dt if v >= after else v

        def walk(o):
            if isinstance(o, dict):
                for k, v in o.items():
                    if k in T and isinstance(v, (int, float)):
                        o[k] = sh(v)
                    elif k in ("show", "skate_w"):
                        o[k] = [sh(v[0]), sh(v[1])]
                    elif k == "keys":
                        for key in v:
                            key[0] = sh(key[0])
                    elif k in ("poses", "skate"):
                        for w in v:
                            w[0], w[1] = sh(w[0]), sh(w[1])
                    elif k == "costume":
                        for c in v:
                            c[0] = sh(c[0])
                    else:
                        walk(v)
            elif isinstance(o, list):
                for x in o:
                    walk(x)
        walk({k: v for k, v in self.d.items() if k != "duration"})
        self.d["duration"] += dt

    def save(self):
        for k in ("bubbles", "captions", "sfx"):
            self.d[k].sort(key=lambda e: e.get("t0", e.get("t")))
        OUT.mkdir(parents=True, exist_ok=True)
        f = OUT / f"{self.d['id']}.json"
        f.write_text(json.dumps(self.d, ensure_ascii=False, indent=1))
        print(f"{f.name}: {self.d['duration']}s, {len(self.d['shots'])} shots, "
              f"{len(self.d['bubbles'])} bubbles, {len(self.d['sfx'])} sound cues")


def doorframe(ep, t0, t1, a_id, b_id, b_who, bigger, label, tiptoe=None, b_costume=None, hold=None):
    """Back-to-back height check at the door frame (close-up)."""
    ep.shot(t0, t1, "doorframe", music="soft")
    ep.actor(a_id, "me", t0, t1, 820, s=2.0, hat="#D64541")
    ep.actor(b_id, b_who, t0, t1, 1100, s=2.0, flip=True, **({"hold": hold} if hold else {}))
    if b_costume:
        ep.wear(b_id, t0, **b_costume)
    if tiptoe:
        ep.pose(b_id, tiptoe[0], tiptoe[1], "tiptoe")
        ep.sfx(tiptoe[0] + 0.2, "squeak", 0.7)
        ep.sfx(tiptoe[1], "thud")
    ep.fx("heightMark", t0 + 0.6, t1, a=a_id, b=b_id, bigger=bigger, label=label)
    ep.sfx(t0 + 0.6, "rise", 0.7)
    ep.sfx(label, "ding", 0.7)


ME_HAT = "#D64541"

# =========================================================== 第 1 集 ===
e = Ep("ep1", "第 1 集　去爷爷家拜年", 170)
# 豆豆家：出发
e.shot(0, 14, "home", music="festive")
e.fx("firecrackers", 0, 3.4, x=1780)
for k in range(14):
    e.sfx(0.15 + k * 0.21, "crack", 0.55)
e.actor("dd", "me", 0, 14, -220, hat=ME_HAT)
e.walk_in("dd", 0.4, 1.6, 760)
e.pose("dd", 1.6, 2.4, "jump")
e.sfx(1.7, "boing", 0.6)
e.say("dd", 2.4, 6.4, "过年啦！\n我要去爷爷家拜年！")
e.say("dd", 6.6, 10.2, "可是亲戚好多，\n我老是叫错……")
e.pose("dd", 6.8, 10.2, "scratch")
e.move("dd", 11.0, 520, dur=0.8)
e.fx("albumIntro", 10.4, 14.2, x=1250, y=470)
e.sfx(10.5, "page")
e.cap(10.6, 14, "叫对一个人，就贴一张贴纸。贴满了，就拍全家福！")
e.d["album"] = {"t0": 14, "t1": 152, "pages": "L"}

# 爷爷家门口
e.shot(14, 40, "door", music="festive", open=17.6)
e.actor("dd2", "me", 14, 40, -220, hat=ME_HAT)
e.walk_in("dd2", 14.3, 16.2, 560)
for k in range(3):
    e.sfx(16.5 + k * 0.4, "knock")
e.fx("doorShake", 16.5, 17.6)
e.sfx(17.7, "creak")
e.actor("yeye", "yeye", 18.0, 40, 1150, hold={"right": "rod"})
e.move("yeye", 19.0, 1240)
e.say("dd2", 19.2, 23.4, "爸爸的爸爸，叫爷爷！\n爷爷过年好！")
e.chip("yeye", 20.4, 26.2, 1240)
e.say("yeye", 23.6, 26.0, "哎！乖孙子！")
e.pose("yeye", 23.6, 26.0, "laugh")
e.sticker(26.2, "yeye", "yeye")
e.move("yeye", 27.2, 1500, dur=0.8)
e.actor("nainai", "nainai", 26.6, 40, 1150, hold={"right": "plate"})
e.move("nainai", 27.6, 1180)
e.say("dd2", 27.8, 31.8, "爸爸的妈妈，叫奶奶！\n奶奶过年好！")
e.chip("nainai", 28.8, 34.2, 1180)
e.say("nainai", 31.9, 34.0, "来，吃饺子！")
e.sticker(34.2, "nainai", "nainai")
e.sfx(34.4, "whistle")
e.say("nainai", 35.0, 39.6, "快看，\n兄弟足球队来啦！")
e.move("dd2", 35.4, 560, flip=True, dur=0.1)
e.pose("dd2", 35.6, 36.4, "jump")

# 院子：兄弟足球队
e.shot(40, 88, "yard", music="festive")
e.actor("dd3", "me", 40, 88, 300, hat=ME_HAT)
for id_, who, num, x, t0, t1 in (("bobo", "bobo", "1", 700, 40.2, 41.8), ("baba", "baba", "2", 960, 40.5, 42.1)):
    e.actor(id_, who, t0, 88, 2200, flip=True)
    e.wear(id_, t0, jersey={"color": ORANGE, "num": num})
    e.walk_in(id_, t0, t1, x)
e.actor("shushu", "shushu", 41.2, 88, 2300, flip=True)
e.wear("shushu", 41.2, jersey={"color": ORANGE, "num": "3"})
e.move("shushu", 43.6, 1220)
e.d["actors"][-1]["skate"].append([41.2, 44.4])
e.sfx(41.3, "skate")
e.pose("shushu", 43.6, 44.3, "jump")
e.fx("banner", 41.8, 52.3, text="兄弟足球队")  # → 55.3 after the shift below
e.sfx(41.9, "cheer", 0.8)
# name plates over the three brothers: 爸爸 is known from the start, the other
# two show "？" until 豆豆 names them correctly (times before the shift)
e.fx("nameplate", 42.0, 88.0, at="baba", num="2", name="爸爸")
e.fx("nameplate", 42.0, 88.0, at="bobo", num="1", name="伯伯", reveal=56.0)
e.fx("nameplate", 42.0, 88.0, at="shushu", num="3", name="叔叔", reveal=71.2)

e.fx("spot", 52.3, 60.4, x=700)  # (shifted +3 s below)
e.say("bobo", 52.4, 54.6, "哈哈哈！")
e.pose("bobo", 52.4, 54.6, "laugh")
e.say("dd3", 54.8, 59.8, "比爸爸大的 1 号，\n叫伯伯！伯伯好！")
e.chip("bobo", 56.0, 60.4, 700, tag="▲ 比爸爸大")
e.sticker(60.4, "bobo", "bobo")

e.fx("spot", 60.6, 75.2, x=1220)
e.pose("shushu", 60.8, 61.4, "jump")
e.say("dd3", 61.4, 64.2, "比爸爸小的 3 号，\n叫……爷爷好！")
e.fx("puff", 64.3, 65.2, at="shushu")
e.sfx(64.3, "poof")
e.pose("shushu", 64.6, 69.7, "old")
e.say("shushu", 65.0, 69.3, "我有那么老吗？？")
e.sfx(65.2, "huh")
for id_ in ("bobo", "baba"):
    e.pose(id_, 65.6, 68.4, "laugh")
e.fx("puff", 69.6, 70.4, at="shushu")
e.sfx(69.6, "poof")
e.say("dd3", 70.4, 74.2, "对不起！是叔叔！\n叔叔好！")
e.pose("dd3", 70.4, 71.6, "scratch")
e.chip("shushu", 71.2, 75.2, 1220, tag="▼ 比爸爸小")
e.pose("shushu", 71.6, 74.0, "wave")
e.sticker(74.8, "shushu", "shushu")

e.move("dd3", 75.4, 190, dur=0.6)
e.actor("gugu", "gugu", 75.0, 88, -220, hold={"right": "camera"})
e.walk_in("gugu", 75.0, 76.6, 470)
e.fx("flash", 77.0, 77.5)
e.sfx(77.0, "shutter")
e.move("gugu", 78.6, 500, dur=0.6)
e.fx("banner", 78.2, 84.4, text="兄弟足球队", blink=True)
e.say("gugu", 79.2, 84.4, "我是爸爸的妹妹，\n不是兄弟，不进兄弟队！")
e.pose("gugu", 80.0, 84.0, "shake")
e.say("dd3", 84.6, 87.8, "那你是姑姑！\n姑姑好！")
e.chip("gugu", 85.4, 88.0, 500)
e.sticker(87.6, "gugu", "gugu")

# 院子：堂哥 (times before the shift)
e.shot(88, 103, "yard", music="festive")
e.actor("dd4", "me", 88, 103, 380, hat=ME_HAT)
e.actor("shushu2", "shushu", 88, 103, 1500, flip=True)
e.wear("shushu2", 88, jersey={"color": ORANGE, "num": "3"})
e.fx("ball", 88.4, 90.2, x0=2000, x1=900)
e.sfx(88.5, "bounce")
e.say("dd4", 89.4, 91.8, "咦，谁的球？")
e.actor("tangge", "tangge", 91.4, 103, 2150, flip=True)
e.wear("tangge", 91.4, jersey={"color": ORANGE})
e.walk_in("tangge", 91.4, 92.8, 1050)
e.say("shushu2", 93.0, 96.8, "这是我儿子，\n兄弟队的小队员！")
e.fx("glow", 97.0, 103, at="tangge", color=ORANGE)
e.sfx(97.0, "sparkle")
e.cap(97.4, 103, "穿兄弟队球衣的孩子，叫「堂」！")
e.word(97.0, 116.2, [(0, "堂", "táng", "tang", 98.2), (1, "哥", "gē", "ink", 108.2)], merge=109.8)

doorframe(e, 103, 113, "dd5", "tangge2", "tangge", True, 105.2, b_costume={"jersey": {"color": ORANGE}})
e.say("dd5", 105.6, 109.6, "他比我大，\n是哥哥！")
e.cap(110, 113, "叔叔的儿子比我大，叫「堂」哥。")

# 院子：表妹
e.shot(113, 137, "yard", music="festive")
e.actor("dd6", "me", 113, 137, 360, hat=ME_HAT)
e.actor("tangge3", "tangge", 113, 118, 1050, flip=True, hold={"left": "ball"})
e.wear("tangge3", 113, jersey={"color": ORANGE})
e.say("tangge3", 113.4, 116.0, "走，踢球去！")
e.sticker(116.4, "tangge", "tangge3")
e.move("tangge3", 118.0, 2200, dur=1.4)
e.actor("biaomei", "biaomei", 117.0, 137, -220, hold={"left": "rabbit"})
e.wear("biaomei", 117.0, shirt="#F2C94C")
e.walk_in("biaomei", 117.0, 118.6, 760)
e.say("dd6", 119.0, 123.2, "我知道！\n她是……「堂」妹！")
e.pose("dd6", 119.0, 120.2, "jump")
e.fx("bigJersey", 123.4, 127.2, at="biaomei", color=ORANGE)
e.sfx(123.5, "flop")
e.sfx(124.6, "rustle")
e.sfx(126.8, "pop")
e.say("biaomei", 127.2, 131.6, "我妈妈是姑姑，\n不在兄弟队！")
e.pose("biaomei", 127.4, 131.4, "shake")
e.wear("biaomei", 131.8, shirt=TEAL)
e.fx("glow", 131.8, 137, at="biaomei", color=TEAL)
e.sfx(131.8, "sparkle")
e.cap(132, 137, "不穿兄弟队球衣的孩子，叫『表』！")
e.word(131.8, 150.6, [(0, "表", "biǎo", "biao", 133.0), (1, "妹", "mèi", "ink", 146.0)], merge=147.6)

doorframe(e, 137, 150, "dd7", "biaomei2", "biaomei", False, 144.0, tiptoe=(138.0, 143.2),
          b_costume={"shirt": TEAL}, hold={"left": "rabbit"})
e.say("dd7", 139.4, 142.8, "咦？你踮脚啦！")
e.say("dd7", 144.4, 149.4, "她比我小，\n是妹妹——表妹！")
# back in the yard
e.shot(150, 153, "yard", music="festive")
e.actor("dd8", "me", 150, 153, 560, hat=ME_HAT)
e.actor("biaomei3", "biaomei", 150, 153, 1050, flip=True, hold={"left": "rabbit"})
e.wear("biaomei3", 150, shirt=TEAL)
e.pose("biaomei3", 150.2, 152.6, "wave")
e.sticker(151.0, "biaomei", "biaomei3")

# 相册：爸爸这边
e.shot(153, 170, "album", music="calm", pages="L", full=153.4)
e.sfx(153.4, "fanfare")
e.cap(156.0, 161, "豆豆：爸爸这边，贴满啦！")
e.cap(161.5, 169, "下一集：去外婆家拜年！")
# make room for "我是爸爸，2 号！": everything from the 伯伯 beat on moves 3 s later
e.shift(52.3, 3.0)
# the new beat: 爸爸 introduces himself, and the other two are measured against him
e.say("baba", 44.6, 47.4, "豆豆！\n我是爸爸，2 号！")
e.pose("baba", 44.6, 47.4, "wave")
e.say("dd3", 47.6, 49.4, "爸爸！")
e.pose("dd3", 47.6, 48.4, "jump")
e.fx("rankArrow", 49.6, 55.2, xs=[700, 960, 1220])
for tt in (50.2, 52.6, 53.8):
    e.sfx(tt, "ding", 0.6)
e.cap(49.6, 52.4, "中间的 2 号，是爸爸。")
e.cap(52.4, 55.2, "1 号比爸爸大，3 号比爸爸小。")
e.save()

# =========================================================== 第 2 集 ===
e = Ep("ep2", "第 2 集　去外婆家拜年", 172)
e.shot(0, 22, "yard", music="calm", title="上集回顾")
e.actor("dd", "me", 0, 22, 300, hat=ME_HAT)
e.actor("tangge", "tangge", 0, 22, 760, flip=True)
e.wear("tangge", 0, jersey={"color": ORANGE})
e.actor("biaomei", "biaomei", 0, 22, 1250, flip=True, hold={"left": "rabbit"})
e.wear("biaomei", 0, shirt=TEAL)
e.cap(0.6, 6.6, "上一集，我们认识了兄弟足球队。")
e.cap(6.8, 13.6, "伯伯、叔叔家的孩子是小队员，叫「堂」；")
e.fx("glow", 7.0, 13.6, at="tangge", color=ORANGE)
e.chip("tangge", 8.0, 13.6, 760)
e.cap(13.8, 21.4, "姑姑家的孩子不是，叫『表』。")
e.fx("glow", 14.0, 21.4, at="biaomei", color=TEAL)
e.chip("biaomei", 15.0, 21.4, 1250)

e.shot(22, 40, "road", music="festive")
e.fx("car", 22, 40, x=960, y=760)
e.sfx(22.3, "car")
e.say("dd", 23.6, 28.2, "外婆家要坐车，\n去外面！", at=[1090, 560])
e.fx("outChar", 28.6, 39.6, x=1090, y=640)
e.sfx(28.7, "boing")
e.cap(31, 39.6, "妈妈的爸爸妈妈，名字前面加一个“外”字。")

e.shot(40, 62, "living", music="festive")
e.actor("waigong", "waigong", 40, 62, 1300, flip=True)
e.fx("chessTable", 40, 62, x=1300)
e.say("waigong", 40.6, 43.4, "将军！")
e.sfx(40.8, "slam")
e.actor("dd2", "me", 41.8, 62, -220, hat=ME_HAT)
e.walk_in("dd2", 41.8, 43.4, 460)
e.say("dd2", 43.8, 48.6, "妈妈的爸爸，叫外公！\n外公过年好！")
e.chip("waigong", 45.2, 50.4, 1300)
e.pose("waigong", 48.8, 50.2, "laugh")
e.sticker(50.4, "waigong", "waigong", "R")
e.actor("waipo", "waipo", 50.6, 62, 2150, flip=True)
e.walk_in("waipo", 50.6, 52.2, 880)
e.fx("notes", 50.6, 61.8, at="waipo")
e.say("waipo", 52.2, 54.6, "啦啦啦～")
e.say("dd2", 54.8, 59.2, "妈妈的妈妈，叫外婆！\n外婆过年好！")
e.chip("waipo", 56.0, 61.4, 880)
e.say("waipo", 59.4, 61.8, "乖乖～")
e.sticker(61.6, "waipo", "waipo", "R")

e.shot(62, 102, "living", music="festive")
e.actor("dd3", "me", 62, 102, 460, hat=ME_HAT)
e.actor("jiujiu", "jiujiu", 62.2, 102, 2150, flip=True)
e.walk_in("jiujiu", 62.2, 63.8, 900)
e.move("dd3", 64.8, 900, 470, dur=0.6)
e.pose("jiujiu", 64.2, 70.4, "armsUp")
e.pose("dd3", 64.8, 70.2, "fly")
e.say("jiujiu", 64.9, 67.6, "飞咯！", at=[1200, 520])
e.sfx(64.9, "whee")
e.cap(66.2, 71, "妈妈的兄弟，叫舅舅。")
e.chip("jiujiu", 66.6, 71.4, 1380, y=300)
e.move("dd3", 70.8, 600, GROUND, dur=0.6)
e.fx("dizzy", 71.0, 74.4, at="dd3")
e.sfx(71.0, "dizzy")
e.say("dd3", 71.2, 74.0, "谢谢……叔叔！")
e.fx("puff", 74.2, 75.0, at="jiujiu")
e.sfx(74.2, "poof")
e.wear("jiujiu", 74.4, jersey={"color": ORANGE, "num": "3"})
e.actor("shushu", "shushu", 74.6, 81.4, 2150, flip=True)
e.move("shushu", 75.4, 1720)
e.say("shushu", 75.6, 79.2, "嘿！\n那是我的球衣！")
e.fx("flyJersey", 79.4, 80.2, from_="jiujiu", to="shushu", color=ORANGE)
e.sfx(79.4, "whoosh", 0.7)
e.wear("jiujiu", 79.5, jersey=None)
e.move("shushu", 81.4, 2200, dur=1.0)
e.say("jiujiu", 80.4, 84.8, "我是妈妈的兄弟，\n是舅舅！")
e.say("dd3", 85.0, 87.6, "舅舅好！")
e.sticker(88.0, "jiujiu", "jiujiu", "R")
e.actor("yima", "yima", 88.4, 102, 2150, flip=True, hold={"right": "candyBag"})
e.walk_in("yima", 88.4, 90.0, 1300)
e.fx("candies", 90.2, 101.8, x=1300)
e.sfx(90.2, "candy")
e.cap(90.6, 95.6, "妈妈的姐妹，叫姨妈。")
e.chip("yima", 91.0, 96.6, 1300)
e.say("dd3", 95.8, 98.4, "姨妈好！")
e.say("yima", 98.6, 101.6, "吃糖，吃糖！")
e.sticker(101.6, "yima", "yima", "R")

e.shot(102, 114, "living", music="festive")
e.actor("dd4", "me", 102, 114, 400, hat=ME_HAT)
e.actor("biaojie", "biaojie", 102.4, 114, 2150, flip=True, hold={"left": "board"})
e.walk_in("biaojie", 102.4, 104.0, 1080)
e.cap(103.2, 108.6, "妈妈这边，没有兄弟足球队！")
e.fx("jerseyRule", 104.0, 114.0, x=960, y=300, cross=105.6, lit=107.0)
e.sfx(105.6, "buzz", 0.6)
e.sfx(107.0, "sparkle")
e.cap(108.8, 114, "所以，妈妈这边的孩子，都叫『表』！")
e.word(108.8, 127.4, [(0, "表", "biǎo", "biao", 110.6), (1, "姐", "jiě", "ink", 119.0)], merge=120.4)

doorframe(e, 114, 127.4, "dd5", "biaojie2", "biaojie", True, 116.2, hold={"left": "board"})
e.say("dd5", 117.0, 121.6, "她比我大，\n是姐姐——表姐！")
e.say("biaojie2", 122.0, 125.6, "我给你画张像！")
e.sticker(126.0, "biaojie", "biaojie2", "R")

e.shot(127.4, 131.6, "living", music="festive")
e.actor("biaodi", "biaodi", 127.4, 131.6, 1000, flip=True)
e.fx("cheeks", 127.4, 131.6, at="biaodi")
e.actor("yima2", "yima", 127.4, 131.6, 1450, flip=True)
e.say("yima2", 128.0, 131.4, "又偷吃糖！")
e.pose("biaodi", 128.4, 131.4, "shake")

e.word(131.6, 145.2, [(0, "表", "biǎo", "biao", 132.0), (1, "弟", "dì", "ink", 138.4)], merge=139.8)
doorframe(e, 131.6, 145.2, "dd6", "biaodi2", "biaodi", False, 136.2, tiptoe=(132.4, 135.4))
e.fx("cheeks", 131.6, 135.4, at="biaodi2")
e.fx("candyDrop", 135.4, 137.0, at="biaodi2")
e.say("dd6", 136.6, 141.4, "他比我小，\n是弟弟——表弟！")
e.sticker(144.6, "biaodi", "biaodi2", "R")
e.d["album"] = {"t0": 0, "t1": 145, "pages": "LR", "prefilled": "L"}

e.shot(145, 172, "album", music="calm", pages="LR", full=145.4, merge=151.6)
e.sfx(145.4, "fanfare")
e.cap(146, 151.4, "妈妈这边，也贴满啦！")
e.sfx(151.8, "page")
e.sfx(154.4, "sparkle")
e.cap(157.4, 164, "爸爸这边，妈妈这边，中间都是同一个我！")
e.cap(164.6, 171, "下一集：拍全家福！")
e.save()

# =========================================================== 第 3 集 ===
e = Ep("ep3", "第 3 集　拍全家福", 116)
BACK, MID, FRONT = 690, 800, 925
e.shot(0, 36, "studio", music="festive", polaroid=24.4)
back = [("bobo", 450), ("baba", 650), ("shushu", 850), ("gugu", 1050), ("mama", 1250), ("jiujiu", 1450), ("yima", 1650)]
mid = [("yeye", 560), ("nainai", 790), ("waigong", 1130), ("waipo", 1360)]
front = [("tangge", 560), ("biaomei", 760), ("me", 960), ("biaojie", 1160), ("biaodi", 1360)]
for k, (who, x) in enumerate(back):
    if who == "gugu":
        continue
    e.actor(f"p_{who}", who, 0.3 + k * 0.08, 36, [x, BACK], s=1.2)
e.actor("p_gugu", "gugu", 0.3, 36, [330, FRONT], s=1.3)
for k, (who, x) in enumerate(mid):
    e.actor(f"p_{who}", who, 0.9 + k * 0.1, 36, [x, MID], s=1.25)
for k, (who, x) in enumerate(front):
    e.actor(f"p_{who}", who, 1.5 + k * 0.1, 36, [x, FRONT], s=1.3, **({"hat": ME_HAT} if who == "me" else {}))
for who in ("tangge",):
    e.wear(f"p_{who}", 0, jersey={"color": ORANGE})
for who in ("biaomei", "biaojie"):
    e.wear(f"p_{who}", 0, shirt=TEAL)
e.fx("tripod", 0, 36, x=200)
for k in range(3):
    e.sfx(0.3 + k * 0.6, "pop", 0.6)
e.cap(0.6, 5.6, "过年啦，全家人一起拍全家福！")
e.say("p_gugu", 5.8, 8.8, "我来定时！")
e.move("p_gugu", 9.0, 330, FRONT, dur=0.2)
e.move("p_gugu", 10.8, 1050, BACK, 1.2)
e.fx("digits", 11.0, 14.0, x=200)
for k in range(3):
    e.sfx(11.0 + k, "beep")
e.say("p_biaodi", 13.4, 15.4, "阿——嚏！")
e.sfx(14.0, "sneeze")
e.fx("sneeze", 14.0, 16.0, at="p_biaodi")
e.fx("chaos", 14.1, 17.6)
e.fx("flash", 14.6, 15.1)
e.sfx(14.6, "shutter")
e.fx("stamp", 15.4, 19.6, text="拍糊啦！")
e.sfx(15.5, "stamp")
e.cap(15.8, 20.2, "哎呀，拍糊啦！再来一次！")
e.fx("digits", 20.4, 23.4, x=200)
for k in range(3):
    e.sfx(20.4 + k, "beep")
e.say("all", 23.4, 25.6, "茄——子！", at=[960, 210])
e.fx("flash", 24.2, 24.8)
e.sfx(24.2, "shutter")
e.sfx(24.6, "fanfare")
e.cap(26, 33, "咔嚓！这就是我们的全家福！")

# 儿歌（《两只老虎》调，传统曲调）
BPM = 108
BEAT = 60 / BPM
SONG_T0 = 37.0 + 4 * BEAT
e.shot(36, 77, "stage", music="song")
melody = [  # (beats, midi) per bar, Frère Jacques / 两只老虎
    [(1, 60), (1, 62), (1, 64), (1, 60)], [(1, 60), (1, 62), (1, 64), (1, 60)],
    [(1, 64), (1, 65), (2, 67)], [(1, 64), (1, 65), (2, 67)],
    [(.5, 67), (.5, 69), (.5, 67), (.5, 65), (1, 64), (1, 60)], [(.5, 67), (.5, 69), (.5, 67), (.5, 65), (1, 64), (1, 60)],
    [(1, 60), (1, 55), (2, 60)], [(1, 60), (1, 55), (2, 60)],
]
verses = [
    ["伯伯叔叔", "伯伯叔叔", "家的娃", "叫「堂」呀", "姑姑舅舅姨妈", "他们家的娃娃", "都叫『表』", "都叫『表』"],
    ["比我大的", "比我大的", "是哥哥", "是姐姐", "比我小的弟弟", "比我小的妹妹", "拉拉手", "拉拉手"],
]
song = {"t0": SONG_T0, "bpm": BPM, "bars": []}
t = SONG_T0
for verse in verses:
    for bar, text in enumerate(verse):
        notes, tb = [], t
        for beats, m in melody[bar]:
            notes.append({"t": round(tb, 3), "m": m, "d": beats * BEAT})
            tb += beats * BEAT
        song["bars"].append({"t": round(t, 3), "text": text, "notes": notes})
        t += 4 * BEAT
song["t1"] = round(t + 2 * BEAT, 3)
e.d["song"] = song
bar = lambda i: song["bars"][i]["t"]
# who dances to which line
groups = [
    (0, 2, [("bobo", 700, {"jersey": {"color": ORANGE, "num": "1"}}), ("shushu", 1220, {"jersey": {"color": ORANGE, "num": "3"}})]),
    (2, 4, [("bobo", 560, {"jersey": {"color": ORANGE, "num": "1"}}), ("tangge", 960, {"jersey": {"color": ORANGE}}), ("shushu", 1360, {"jersey": {"color": ORANGE, "num": "3"}})]),
    (4, 6, [("gugu", 560, {}), ("jiujiu", 960, {}), ("yima", 1360, {})]),
    (6, 8, [("biaomei", 600, {"shirt": TEAL}), ("biaojie", 960, {}), ("biaodi", 1320, {})]),
    (8, 10, [("tangge", 640, {"jersey": {"color": ORANGE}}), ("me", 960, {}), ("biaojie", 1280, {})]),
    (10, 12, [("tangge", 640, {"jersey": {"color": ORANGE}}), ("me", 960, {}), ("biaojie", 1280, {})]),
    (12, 14, [("biaodi", 640, {}), ("me", 960, {}), ("biaomei", 1280, {"shirt": TEAL})]),
    (14, 16, [("tangge", 480, {"jersey": {"color": ORANGE}}), ("biaomei", 720, {"shirt": TEAL}), ("me", 960, {}),
              ("biaojie", 1200, {}), ("biaodi", 1440, {})]),
]
for gi, (b0, b1, members) in enumerate(groups):
    t0 = bar(b0)
    t1 = bar(b1) if b1 < len(song["bars"]) else song["t1"]
    for who, x, cos in members:
        aid = f"s{gi}_{who}"
        e.actor(aid, who, t0, t1, [x, 770], s=1.5, **({"hat": ME_HAT} if who == "me" else {}))
        if cos:
            e.wear(aid, t0, **cos)
        e.pose(aid, t0, t1, "holdHands" if gi == 7 else "dance")
e.fx("songMarks", SONG_T0, song["t1"], bars=[bar(i) for i in range(len(song["bars"]))])
e.fx("lyrics", SONG_T0 - 2 * BEAT, song["t1"])

# 复习字卡
e.shot(77, 98, "plain", music="calm")
cards = [("堂", "táng", "tang"), ("表", "biǎo", "biao"), ("哥", "gē", "ink"), ("姐", "jiě", "ink"), ("弟", "dì", "ink"), ("妹", "mèi", "ink")]
e.fx("review", 77, 98, cards=[{"ch": c, "py": p, "color": col, "t": 79.0 + i * 1.8} for i, (c, p, col) in enumerate(cards)])
for i in range(6):
    e.sfx(79.0 + i * 1.8, "mallet", 0.9)
e.cap(78.4, 90.4, "今天我们学会了：「堂」、『表』、哥、姐、弟、妹。")
e.cap(90.6, 97.6, "爸爸兄弟家的孩子叫「堂」，别人家的孩子叫『表』。")

e.shot(98, 116, "home", music="festive")
e.actor("dd", "me", 98, 116, 960, s=2.1, hat=ME_HAT)
e.pose("dd", 98.4, 115, "wave")
e.say("dd", 99.0, 104.0, "过年见到家人，\n记得叫对哦！")
e.say("dd", 104.4, 107.6, "新年快乐！")
e.fx("fireworks", 104.0, 115.0)
for k in range(8):
    e.sfx(104.2 + k * 1.3, "firework", 0.7)
e.fx("title", 108.0, 116.0, text="豆豆拜年记 · 完")
e.save()
