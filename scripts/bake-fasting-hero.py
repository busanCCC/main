"""2026 금식수련회 히어로 레이어를 미리 구워 낸다.

런타임 clip-path / drop-shadow / grayscale 필터는 스크롤 중 매 프레임 다시 그려져 모바일에서 무겁다.
찢김선 모양과 그림자를 투명 WebP 로 구워 두고 페이지에서는 이미지만 겹친다.

실행: python3 -m pip install pillow numpy && python3 scripts/bake-fasting-hero.py <storm.png> <hiker.png>
  storm.png  흑백 폭풍 절벽 원본(1672×941)
  hiker.png  투명 배경 배낭 여행자 원본(1672×941, 배경과 같은 캔버스)
"""

import sys
from math import hypot
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "retreat"
W, H = 1672, 941
SS = 4  # 가장자리 안티에일리어싱용 슈퍼샘플링 배율

# 16:9 무대 좌표. 포스터 원본의 흰 찢김선을 추적한 값이며, 마지막 구간은 바위 턱을 따라 내려간다.
STAGE_W, STAGE_H = 1600, 900
TEAR_LINE = [
    (0.232, -0.02), (0.247, 0.056), (0.259, 0.111), (0.27, 0.167), (0.286, 0.222),
    (0.299, 0.278), (0.316, 0.333), (0.327, 0.389), (0.348, 0.444), (0.357, 0.5),
    (0.367, 0.556), (0.39, 0.611), (0.398, 0.667), (0.405, 0.722), (0.416, 0.78),
    (0.43, 0.818), (0.47, 0.83), (0.53, 0.835), (0.6, 0.85), (0.632, 0.9), (0.652, 1.02),
]


def seeded(seed):
    s = seed

    def rand():
        nonlocal s
        s = (s * 16807) % 2147483647
        return s / 2147483647

    return rand


def torn_edge(seed, offset, amp):
    """찢김선을 잘게 나눠 법선 방향으로 흔든 종이 섬유 가장자리(0–100%)."""
    rand = seeded(seed)
    pts = []
    for (ax, ay), (bx, by) in zip(TEAR_LINE, TEAR_LINE[1:]):
        x0, y0, x1, y1 = ax * STAGE_W, ay * STAGE_H, bx * STAGE_W, by * STAGE_H
        length = hypot(x1 - x0, y1 - y0)
        nx, ny = (y1 - y0) / length, -(x1 - x0) / length
        steps = max(1, round(length / 6))
        for s in range(steps):
            t = s / steps
            d = offset + (rand() - 0.5) * 2 * amp
            pts.append((x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d))
    lx, ly = TEAR_LINE[-1]
    pts.append((lx * STAGE_W + offset, ly * STAGE_H))
    return [(x / STAGE_W * 100, y / STAGE_H * 100) for x, y in pts]


def mask(poly):
    img = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(img).polygon([(x / 100 * W * SS, y / 100 * H * SS) for x, y in poly], fill=255)
    return img.resize((W, H), Image.LANCZOS)


def shadow(shape, dx, dy, blur, alpha):
    a = np.asarray(shape.filter(ImageFilter.GaussianBlur(blur)), dtype=np.float32) * alpha
    shifted = np.zeros_like(a)
    shifted[max(dy, 0):H + min(dy, 0), max(dx, 0):W + min(dx, 0)] = a[
        max(-dy, 0):H - max(dy, 0), max(-dx, 0):W - max(dx, 0)
    ]
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.putalpha(Image.fromarray(shifted.clip(0, 255).astype(np.uint8)))
    return out


def with_alpha(rgb, alpha):
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def main(storm_path, hiker_path):
    storm = Image.open(storm_path).convert("RGB").resize((W, H), Image.LANCZOS)
    cut = torn_edge(7, 0, 2.2)
    fiber = torn_edge(13, 15, 5)
    keep_mask = mask([(-1, -2), *cut, (-1, 102)])
    fiber_mask = mask([(-1, -2), *fiber, (-1, 102)])
    torn_mask = mask([*cut, (101, 102), (101, -2)])

    # 남는 흑백 절벽. 찢길 조각과 경계를 1–2px 겹쳐, 두 레이어의 안티에일리어싱 틈으로 뒤가 비치는 실선을 없앤다
    with_alpha(storm, keep_mask.filter(ImageFilter.MaxFilter(5))).save(OUT / "2026fasting-keep.webp", quality=86, method=6)

    # 흰 종이 단면 + 남는 조각이 드리우는 그림자 (찢김이 내려가며 함께 드러난다)
    paper = Image.new("RGBA", (W, H), (244, 241, 234, 0))
    paper.putalpha(fiber_mask)
    fiber_layer = Image.alpha_composite(shadow(fiber_mask, 5, 2, 4, 0.3), paper)
    fiber_layer.save(OUT / "2026fasting-fiber.webp", quality=90, method=6)

    # 찢겨 나가는 조각 + 왼쪽으로 드리우는 그림자
    torn = Image.alpha_composite(shadow(torn_mask, -14, 6, 11, 0.5), with_alpha(storm, torn_mask))
    torn.save(OUT / "2026fasting-torn.webp", quality=86, method=6)

    # 여행자 컬러/흑백 (CSS grayscale 과 같은 휘도 가중치)
    hiker = Image.open(hiker_path).convert("RGBA")
    box = (664, 468, 796, 798)
    color = hiker.crop(box)
    rgb = np.asarray(color, dtype=np.float32)
    lum = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722
    gray = np.dstack([lum, lum, lum, rgb[..., 3]]).clip(0, 255).astype(np.uint8)
    color.save(OUT / "2026fasting-hiker.png", optimize=True)
    Image.fromarray(gray, "RGBA").save(OUT / "2026fasting-hiker-gray.png", optimize=True)
    print("hiker box %:", [round(v, 3) for v in (box[0] / W * 100, box[1] / H * 100,
                                                  (box[2] - box[0]) / W * 100, (box[3] - box[1]) / H * 100)])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
