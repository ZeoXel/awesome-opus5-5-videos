"""Writes ../教师讲稿.md — every line of the film with its exact timecode.

    python3 tools/teacher_script.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())


def tc(t):
    return f"{int(t // 60)}:{t % 60:04.1f}"


def plain(s):
    return re.sub(r"「([^」]*)」", r"**\1**", re.sub(r"『([^』]*)』", r"**\1**", s))


pause_t = [c["t0"] for c in TL["countdowns"]]
lines = [
    "# 《从\"我\"出发，找家人》教师讲稿",
    "",
    f"> 成片时长 {tc(TL['duration'])}。下表由 `video/src/timeline.json` 自动生成，与视频字幕逐句对应。",
    "> 视频里的字幕就是旁白；没有配音时，老师照着念即可。**加粗**的字在画面上是橙色（堂）或青色（表）。",
    "> 外公/外婆、姨妈在不少地方叫姥爷/姥姥、姨/阿姨，讲的时候可以换成本地叫法，并告诉孩子两种说法都对。",
    "",
    "## 建议暂停点",
    "",
]
points = [(t, "倒计时开始：可以按暂停，请孩子抢答或用手指在屏幕上\"走路线\"。") for t in pause_t]
points.append((TL["chant"]["t0"], "拍手儿歌：可以拖回这里多唱几遍。"))
for t, what in sorted(points):
    lines.append(f"- **{tc(t)}** {what}")
lines.append("")
for act in TL["acts"]:
    lines += [f"## {act['name']}（{tc(act['t0'])}–{tc(act['t1'])}）", "", "| 时间 | 讲稿 / 字幕 |", "|---|---|"]
    for c in TL["captions"]:
        if act["t0"] <= c["t0"] < act["t1"]:
            mark = "（儿歌，全班拍手跟读）" if c.get("chant") else ""
            text = plain(c["text"])
            if c["text"] == "大声说出来！":
                text = "大声说出来！（5 秒倒计时，留给孩子回答）"
            lines.append(f"| {tc(c['t0'])} | {text}{mark} |")
    lines.append("")
out = ROOT.parent / "教师讲稿.md"
out.write_text("\n".join(lines))
print(f"wrote {out.name}")
