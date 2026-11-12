"""
Draws Inkling's app icons (an ink drop on notebook paper with a red margin)
as PNGs with no dependencies beyond the standard library.

    python3 scripts/make-icons.py

Writes public/icons/*.png and public/favicon.svg. Re-run after changing the design.
"""
import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public"

PAPER = (247, 241, 227)
RULE = (185, 207, 224)
MARGIN = (217, 83, 79)
INK = (31, 42, 68)
SHINE = (90, 108, 150)


def drop_contains(x, y, cx, cy, r):
    """Teardrop pointing up: a circle plus a cone whose sides are tangent to it."""
    if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
        return True
    d = r * 2.3  # distance from the tip to the circle's center
    tip_y = cy - d
    sin_a = r / d
    cos_a = math.sqrt(1 - sin_a * sin_a)
    tangent_y = tip_y + d * cos_a * cos_a
    if tip_y <= y <= tangent_y:
        return abs(x - cx) <= (y - tip_y) * (sin_a / cos_a)
    return False


def color_at(x, y, size, maskable):
    s = size
    pad = 0.0 if maskable else 0.06 * s
    corner = 0.0 if maskable else 0.18 * s
    # Rounded-square card (transparent outside for normal icons).
    inner_x = min(max(x, pad + corner), s - pad - corner)
    inner_y = min(max(y, pad + corner), s - pad - corner)
    if (x - inner_x) ** 2 + (y - inner_y) ** 2 > corner ** 2 or not (pad <= x <= s - pad and pad <= y <= s - pad):
        return None

    # Keep the artwork inside the maskable safe zone (inner 80%).
    scale = 0.78 if maskable else 1.0
    ux = (x - s / 2) / scale + s / 2
    uy = (y - s / 2) / scale + s / 2

    cx, cy, r = s * 0.56, s * 0.62, s * 0.2
    if drop_contains(ux, uy, cx, cy, r):
        # A small highlight on the drop.
        if (ux - (cx - r * 0.38)) ** 2 + (uy - (cy - r * 0.2)) ** 2 <= (r * 0.16) ** 2:
            return SHINE
        return INK
    if abs(ux - s * 0.24) <= s * 0.012:
        return MARGIN
    for i in range(1, 8):
        if abs(uy - s * (0.12 * i + 0.04)) <= s * 0.006:
            return RULE
    return PAPER


def render(size, maskable=False, samples=4):
    rows = []
    for py in range(size):
        row = bytearray([0])  # PNG filter: none
        for px in range(size):
            r = g = b = a = 0
            for sy in range(samples):
                for sx in range(samples):
                    c = color_at(px + (sx + 0.5) / samples, py + (sy + 0.5) / samples, size, maskable)
                    if c:
                        r += c[0]
                        g += c[1]
                        b += c[2]
                        a += 1
            n = samples * samples
            if a:
                row += bytes((r // a, g // a, b // a, round(255 * a / n)))
            else:
                row += bytes((0, 0, 0, 0))
        rows.append(bytes(row))
    return b"".join(rows)


def png(size, pixels):
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(pixels, 9)) + chunk(b"IEND", b"")


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="4" y="4" width="56" height="56" rx="11" fill="#f7f1e3"/>
  <g stroke="#b9cfe0" stroke-width="0.8">
    <path d="M4 18.5H60M4 26.2H60M4 33.9H60M4 41.6H60M4 49.3H60"/>
  </g>
  <path d="M15.4 4V60" stroke="#d9534f" stroke-width="1.6"/>
  <path d="M35.8 10.3L24.3 34.1A12.8 12.8 0 1 0 47.3 34.1Z" fill="#1f2a44"/>
  <circle cx="31" cy="38.4" r="2" fill="#5a6c96"/>
</svg>
"""


def main():
    (OUT / "icons").mkdir(parents=True, exist_ok=True)
    for size, name, maskable in [
        (192, "icon-192.png", False),
        (512, "icon-512.png", False),
        (512, "maskable-512.png", True),
        (180, "apple-touch-icon.png", True),
    ]:
        (OUT / "icons" / name).write_bytes(png(size, render(size, maskable)))
        print("wrote", name)
    (OUT / "favicon.svg").write_text(SVG)
    print("wrote favicon.svg")


if __name__ == "__main__":
    main()
