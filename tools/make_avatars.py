"""Круглі аватари компаньйонів: квадрат, у якому повністю видно голову (з вухами, гривою, рогом).
    python3 tools/make_avatars.py out_dir name=path.png[:neck] ...
Шия шукається автоматично — найвужчий рядок фігури між 22% і 62% висоти; якщо не вгадало,
задайте частку висоти вручну: leo=leo.png:0.43. Нижче голови лишаються плечі — у колі їх акуратно обріже край. Пише <name>-avatar.webp (256×256, прозорий фон). Потрібен Pillow."""
import sys, os
from PIL import Image

PAD = 0.12  # поле довкола голови, щоб у колі нічого не обрізалось

def widths(a):
    w, h = a.size
    px = a.load()
    rows = []
    for y in range(h):
        xs = [x for x in range(w) if px[x, y] > 40]
        rows.append((xs[0], xs[-1]) if xs else None)
    return rows

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for arg in sys.argv[2:]:
    name, _, rest = arg.partition('=')
    path, _, neck = rest.partition(':')
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    a = im.getchannel('A')
    rows = widths(a)
    h = im.height
    if neck:
        ny = round(h * float(neck))
    else:
        lo, hi = int(h * .22), int(h * .62)
        cand = [(r[1] - r[0], y) for y, r in enumerate(rows[lo:hi], lo) if r]
        ny = min(cand)[1]
    head = a.crop((0, 0, im.width, ny))
    x0, y0, x1, y1 = head.getbbox()
    # ширина — не більше 1.4 висоти голови (довгі вуха Флопі інакше «зменшують» мордочку)
    side = max(min(x1 - x0, ny * 1.4), ny) * (1 + 2 * PAD)
    cx = (x0 + x1) / 2
    top = -ny * PAD
    box = (round(cx - side / 2), round(top), round(cx + side / 2), round(top + side))
    sq = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    sq.paste(im.crop((max(box[0], 0), 0, min(box[2], im.width), min(box[3], h))), (max(-box[0], 0), max(-box[1], 0)))
    sq = sq.resize((256, 256), Image.LANCZOS)
    sq.save(os.path.join(out, f'{name}-avatar.webp'), 'WEBP', quality=88, method=6)
    print(name, f'neck={ny / h:.2f}')
