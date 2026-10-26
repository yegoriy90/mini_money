"""Вирізає наліпки з аркушів на зеленому фоні (chroma key): python3 tools/cut_stickers.py out_dir sheet1.png sheet2.png ...
Порядок наліпок — рядками зліва направо, аркуш за аркушем. Пише 01.webp, 02.webp… (256px, прозорий фон)."""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
n = 0
for path in sys.argv[2:]:
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (g > r + 45) & (g > b + 45)          # зелений фон
    fg = ~bg
    # біла рамка аркуша (те, що торкається краю зображення) — теж фон
    lab0, _ = ndimage.label(fg)
    edge_ids = set(np.unique(np.concatenate([lab0[0], lab0[-1], lab0[:, 0], lab0[:, -1]]))) - {0}
    if edge_ids:
        fg &= ~np.isin(lab0, list(edge_ids))
    lab, k = ndimage.label(ndimage.binary_dilation(fg, iterations=5))
    H, W = fg.shape
    items = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        ys, xs = sl
        h, w = ys.stop - ys.start, xs.stop - xs.start
        touches = ys.start == 0 or xs.start == 0 or ys.stop == H or xs.stop == W
        if touches or h < 80 or w < 80:          # рамка аркуша / дрібне сміття
            continue
        items.append(((ys.start + ys.stop) / 2, (xs.start + xs.stop) / 2, sl, i))
    # рядками: групуємо за y, потім за x
    items.sort(key=lambda t: t[0])
    rows, cur = [], []
    for it in items:
        if cur and it[0] - cur[-1][0] > 120:
            rows.append(cur); cur = []
        cur.append(it)
    if cur: rows.append(cur)
    for row in rows:
        for cy, cx, (ys, xs), i in sorted(row, key=lambda t: t[1]):
            pad = 6
            y0, y1 = max(0, ys.start - pad), min(H, ys.stop + pad)
            x0, x1 = max(0, xs.start - pad), min(W, xs.stop + pad)
            crop = a[y0:y1, x0:x1].copy()
            m = (lab[y0:y1, x0:x1] == i) & fg[y0:y1, x0:x1]
            m = ndimage.binary_fill_holes(m)
            alpha = ndimage.gaussian_filter(m.astype(np.float32), 0.8)
            # прибрати зелений відблиск по краю
            edge = (alpha > 0) & (alpha < 1) | ndimage.binary_dilation(~m, iterations=2) & m
            cg = crop[..., 1]; mx = np.maximum(crop[..., 0], crop[..., 2])
            crop[..., 1] = np.where(edge & (cg > mx), mx, cg)
            rgba = np.dstack([np.clip(crop, 0, 255).astype(np.uint8), (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
            img = Image.fromarray(rgba, 'RGBA')
            img.thumbnail((256, 256), Image.LANCZOS)
            canvas = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
            canvas.paste(img, ((256 - img.width) // 2, (256 - img.height) // 2), img)
            n += 1
            canvas.save(os.path.join(out, f'{n:02d}.webp'), 'WEBP', quality=88, method=6)
    print(path, '→', sum(len(r) for r in rows), 'наліпок')
print('усього', n)
