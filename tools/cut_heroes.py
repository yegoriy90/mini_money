"""Готує картинки компаньйонів з вирізаних PNG (прозорий фон, Magnific → remove background):
    python3 tools/cut_heroes.py out_dir name1.png name2.png ...
Пише <name>.webp (повний зріст, висота до 640) і <name>-head.webp (верх фігури — голівка, ширина 320).
Частку висоти для голівки можна задати так: name.png:0.42 (за замовчуванням 0.46). Потрібен Pillow."""
import sys, os
from PIL import Image

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for arg in sys.argv[2:]:
    path, _, frac = arg.partition(':')
    frac = float(frac or 0.46)
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
    head = im.crop((0, 0, im.width, round(im.height * frac)))
    head = head.crop(head.getchannel('A').getbbox())
    if head.width > 320:
        head = head.resize((320, round(head.height * 320 / head.width)), Image.LANCZOS)
    head.save(os.path.join(out, f'{name}-head.webp'), 'WEBP', quality=86, method=6)
    print(name, full.size, head.size)
