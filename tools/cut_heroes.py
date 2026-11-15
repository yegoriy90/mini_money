"""Готує картинки компаньйонів з вирізаних PNG (прозорий фон, Magnific → remove background):
    python3 tools/cut_heroes.py out_dir name1.png name2.png ...
Пише <name>.webp (повний зріст, висота до 640). Круглі аватари — окремо: tools/make_avatars.py. Потрібен Pillow."""
import sys, os
from PIL import Image

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for arg in sys.argv[2:]:
    path = arg
    name = os.path.splitext(os.path.basename(path))[0]
    im = Image.open(path).convert('RGBA')
    # прибрати майже прозорі пікселі (тінь, ореол), потім обрізати порожні краї
    a = im.getchannel('A').point(lambda v: 0 if v < 24 else v)
    im.putalpha(a)
    im = im.crop(a.getbbox())
    full = im.copy()
    if full.height > 640:
        full = full.resize((round(full.width * 640 / full.height), 640), Image.LANCZOS)
    full.save(os.path.join(out, f'{name}.webp'), 'WEBP', quality=86, method=6)
    print(name, full.size)
