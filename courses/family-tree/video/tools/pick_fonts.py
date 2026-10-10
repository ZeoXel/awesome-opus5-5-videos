"""Copies only the LXGW WenKai font chunks this film needs into public/fonts.

The npm package lxgw-wenkai-webfont splits the font into ~300 woff2 files by
unicode-range. We scan every string in src/ (and the timeline), keep the
chunks that cover them, and write public/fonts/fonts.css + src/glyphs.json.

    python3 tools/pick_fonts.py
"""
import json
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
PKG = ROOT / "node_modules" / "lxgw-wenkai-webfont"
OUT = ROOT / "public" / "fonts"

chars = set()
for f in list((ROOT / "src").rglob("*.ts*")) + list((ROOT / "src" / "episodes").glob("*.json")):
    if f.name == "glyphs.json":
        continue
    chars |= {c for c in f.read_text(encoding="utf-8") if ord(c) > 32}
chars |= set("0123456789：？！，。；、“”「」『』·")
codes = {ord(c) for c in chars}


def covers(rng: str) -> bool:
    for part in rng.split(","):
        part = part.strip()[2:]
        lo, _, hi = part.partition("-")
        lo = int(lo, 16)
        hi = int(hi, 16) if hi else lo
        if any(lo <= c <= hi for c in codes):
            return True
    return False


if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)
css_out, n = [], 0
for weight in ("regular", "bold"):
    css = (PKG / f"lxgwwenkai-{weight}.css").read_text()
    for block in re.findall(r"@font-face\s*{[^}]*}", css):
        rng = re.search(r"unicode-range:\s*([^;}]*)", block).group(1)
        if not covers(rng):
            continue
        src = re.search(r"url\('\./files/([^']+)'\)", block).group(1)
        shutil.copy(PKG / "files" / src, OUT / src)
        css_out.append(block.replace("./files/", "./").replace("font-display: swap;", "font-display: block;"))
        n += 1
shutil.copy(PKG / "OFL.txt", OUT / "OFL.txt")
(OUT / "fonts.css").write_text("/* LXGW WenKai (SIL OFL 1.1), subset picked by tools/pick_fonts.py */\n" + "\n".join(css_out) + "\n")
han = "".join(sorted(c for c in chars if ord(c) > 0x2E80))
(ROOT / "src" / "glyphs.json").write_text(json.dumps({"chars": han + "abcdefghijklmnopqrstuvwxyzāáǎàēéěèīíǐìōóǒòūúǔùǚ"}, ensure_ascii=False))
size = sum(p.stat().st_size for p in OUT.iterdir())
print(f"{n} font chunks, {size / 1e6:.1f} MB, {len(han)} CJK glyphs")
