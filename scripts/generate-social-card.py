#!/usr/bin/env python3
"""Render the static After All social-card SVG into a WhatsApp-friendly PNG."""
from io import BytesIO
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "social-card.svg"
DESTINATION = ROOT / "social-card-v2.png"

svg_png = cairosvg.svg2png(url=str(SOURCE))
with Image.open(BytesIO(svg_png)) as original:
    image = original.convert("RGB")
    assert image.size == (1200, 630), f"Unexpected size: {image.size}"
    palette_image = image.quantize(
        colors=192, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    )
    palette_image.save(DESTINATION, format="PNG", optimize=True)

size = DESTINATION.stat().st_size
assert 5000 < size < 600_000, f"Preview PNG should remain under 600 KB, got {size}"
print(f"Generated {DESTINATION.name} at 1200x630 ({size:,} bytes)")
