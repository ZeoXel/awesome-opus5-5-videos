"""Tiles stills into one labelled contact sheet: contact_sheet.py OUT IN..."""
import pathlib
import sys

from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
W, H, cols = 640, 360, 3
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * W, rows * (H + 28)), "white")
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    x, y = (i % cols) * W, (i // cols) * (H + 28)
    sheet.paste(Image.open(f).resize((W, H)), (x, y + 28))
    draw.text((x + 8, y + 6), pathlib.Path(f).stem, fill="black")
sheet.save(out, quality=85)
print(f"contact sheet: {out} ({len(files)} frames)")
