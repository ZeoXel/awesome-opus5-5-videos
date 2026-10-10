"""Writes ../教师讲稿.md — every bubble and caption of the three episodes with timecodes.

    python3 tools/teacher_script.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PEOPLE = {"me": "豆豆", "yeye": "爷爷", "nainai": "奶奶", "bobo": "伯伯", "baba": "爸爸", "shushu": "叔叔", "gugu": "姑姑",
          "tangge": "堂哥", "biaomei": "表妹", "waigong": "外公", "waipo": "外婆", "mama": "妈妈", "jiujiu": "舅舅",
          "yima": "姨妈", "biaojie": "表姐", "biaodi": "表弟"}


def tc(t):
    return f"{int(t // 60)}:{int(t % 60):02d}"


def md(s):
    return re.sub(r"[「『]([^」』]*)[」』]", r"**\1**", s).replace("\n", "")


lines = ["# 《豆豆拜年记》教师讲稿", "",
         "> 由 `video/src/episodes/*.json` 自动生成，和视频逐句对应。",
         "> 视频里角色说话是\"叽里咕噜\"的拟声加气泡字，没有真人配音：老师可以照着下表给角色配音，旁白句由老师来讲。**加粗**的字在画面上是橙色（堂）或青色（表）。",
         "> 外公 / 外婆在北方常叫姥爷 / 姥姥，姨妈也叫小姨、阿姨，讲的时候可以换成本地叫法。", ""]
for f in sorted((ROOT / "src" / "episodes").glob("ep*.json")):
    ep = json.loads(f.read_text())
    who = {a["id"]: PEOPLE[a["who"]] for a in ep["actors"]}
    who["all"] = "全家"
    rows = [(b["t0"], who.get(b["who"], "豆豆"), b["text"]) for b in ep["bubbles"]]
    rows += [(c["t0"], "旁白", c["text"]) for c in ep["captions"]]
    lines += [f"## {ep['title']}（{tc(ep['duration'])}）", "", "| 时间 | 谁 | 台词 |", "|---|---|---|"]
    for t, w, text in sorted(rows):
        lines.append(f"| {tc(t)} | {w} | {md(text)} |")
    lines.append("")
out = ROOT.parent / "教师讲稿.md"
out.write_text("\n".join(lines))
print(f"wrote {out.name}")
