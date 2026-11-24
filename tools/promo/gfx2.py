"""Графіка для динамічного рекламного ролика (Pillow): тла сцен, рамка телефона, заголовки, виноски з емодзі.
Запуск з кореня репозиторію: python3 tools/promo/gfx2.py <тека з clipA.mp4…>  (шрифти Nunito беруться з assets/fonts, потрібен fonttools+brotli)."""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

P = (sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))).rstrip('/') + '/'
W, H = 1080, 1920
INK, PINK = (74, 29, 74), (229, 64, 138)

# --- шрифти: Nunito (variable) з woff2 застосунку, кирилиця й латиниця — окремі файли
for n in ('cyrillic', 'latin'):
    if not os.path.exists(P + f'nunito-{n}.ttf'):
        f = TTFont(f'assets/fonts/nunito-{n}.woff2'); f.flavor = None; f.save(P + f'nunito-{n}.ttf')
CMAP = {k: set(TTFont(P + f'nunito-{k}.ttf').getBestCmap().keys()) for k in ('cyrillic', 'latin')}
_F = {}
def font(kind, size, w=800):
    k = (kind, size, w)
    if k not in _F:
        f = ImageFont.truetype(P + f'nunito-{kind}.ttf', size); f.set_variation_by_axes([w]); _F[k] = f
    return _F[k]
def pick(ch, size, w):
    c = ord(ch)
    if c in CMAP['cyrillic'] and c > 0x7f: return font('cyrillic', size, w)
    if c in CMAP['latin']: return font('latin', size, w)
    return ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', size)
def width(t, size, w=800): return sum(pick(c, size, w).getlength(c) for c in t)
def text(d, xy, t, size, fill, w=800):
    x, y = xy
    for ch in t:
        f = pick(ch, size, w); d.text((x, y), ch, font=f, fill=fill); x += f.getlength(ch)

EMOJI = ImageFont.truetype('/System/Library/Fonts/Apple Color Emoji.ttc', 160)
def emoji(ch, size):
    im = Image.new('RGBA', (200, 200), (0, 0, 0, 0)); ImageDraw.Draw(im).text((0, 0), ch, font=EMOJI, embedded_color=True)
    return im.crop(im.getbbox()).resize((size, size), Image.LANCZOS)

def shadow_of(img, blur=14, off=10, alpha=70, color=(120, 30, 80)):
    a = img.getchannel('A').point(lambda v: v * alpha // 255); sh = Image.new('RGBA', img.size, color + (0,)); sh.putalpha(a)
    sh = sh.filter(ImageFilter.GaussianBlur(blur)); out = Image.new('RGBA', (img.width, img.height + off * 2), (0, 0, 0, 0))
    out.alpha_composite(sh, (0, off)); out.alpha_composite(img, (0, 0)); return out

# --- тла сцен
BGS = {'s1': ((255, 236, 246), (255, 208, 230)), 's2': ((240, 232, 255), (214, 200, 250)), 's3': ((255, 240, 226), (255, 214, 190)),
       's4': ((226, 243, 255), (190, 224, 252)), 's5': ((228, 250, 240), (196, 238, 220)), 's6': ((255, 247, 214), (255, 232, 160))}
for k, (a, b) in BGS.items():
    g = Image.new('RGB', (W, H))
    for y in range(H):
        t = y / (H - 1); g.paste(tuple(round(p + (q - p) * t) for p, q in zip(a, b)), (0, y, W, y + 1))
    g.save(P + f'bg_{k}.png')

# --- телефон: маска, тінь і біла рамка
PW, PH, R, PX, PY = 740, 1608, 90, 170, 270
m = Image.new('L', (PW, PH), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, PW - 1, PH - 1), R, fill=255); m.save(P + 'ph-mask.png')
sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sm = Image.new('L', (W, H), 0)
ImageDraw.Draw(sm).rounded_rectangle((PX, PY + 28, PX + PW, PY + PH + 28), R, fill=100); sm = sm.filter(ImageFilter.GaussianBlur(36)); sh.putalpha(sm)
ring = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ring).rounded_rectangle((PX - 7, PY - 7, PX + PW + 7, PY + PH + 7), R + 7, outline=(255, 255, 255, 255), width=9)
Image.alpha_composite(sh, ring).save(P + 'ph-shadow.png')

# --- заголовок сцени (повний кадр): крапелька-номер зліва + пілюля
def title(name, label, num=None, y=84, size=70):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    tw = width(label, size); pad = 46; bh = size + 56; badge = (bh + 20) if num else 0
    bw = tw + pad * 2 + badge; x = (W - bw) / 2
    pill = Image.new('RGBA', (int(bw), int(bh)), (0, 0, 0, 0)); ImageDraw.Draw(pill).rounded_rectangle((0, 0, bw - 1, bh - 1), bh // 2, fill=(255, 255, 255, 242))
    pill = shadow_of(pill, 14, 10, 70); img.alpha_composite(pill, (int(x), y)); d = ImageDraw.Draw(img)
    cx = x + pad
    if num:
        r = (bh - 14) // 2; cy = y + bh // 2
        d.ellipse((x + 10, cy - r, x + 10 + 2 * r, cy + r), fill=PINK)
        nw = width(str(num), size - 6, 900); text(d, (x + 10 + r - nw / 2, cy - (size - 6) * 0.68), str(num), size - 6, (255, 255, 255), 900)
        cx = x + 10 + 2 * r + 22
    text(d, (cx, y + 24), label, size, INK, 800); img.save(P + name)

title('t_s1.png', 'Дитина виконує справи', 1)
title('t_s2.png', 'Ви підтверджуєте', 2)
title('t_s3.png', 'Монетки діляться самі', 3)
title('t_s4.png', 'Мрія — як пазл')
title('t_s5.png', 'Друзі ростуть з дитиною', size=66)
title('t_s6.png', 'І це ще не все!')

# --- виноски (тісно обрізані): емодзі + текст у пілюлі
def chip(name, em, label, size=52, fill=(255, 255, 255, 248), color=INK):
    es = int(size * 1.15); tw = width(label, size); pad = 30; gap = 16; bh = es + 36; bw = int(pad + es + gap + tw + pad)
    pill = Image.new('RGBA', (bw, bh), (0, 0, 0, 0)); ImageDraw.Draw(pill).rounded_rectangle((0, 0, bw - 1, bh - 1), bh // 2, fill=fill)
    pill.alpha_composite(emoji(em, es), (pad, (bh - es) // 2)); d = ImageDraw.Draw(pill); text(d, (pad + es + gap, (bh - size) // 2 - 6), label, size, color, 800)
    shadow_of(pill, 12, 9, 80).save(P + name)
chip('k_cards.png', '🖼️', 'Яскраві картки справ')
chip('k_hearts.png', '❤️', 'Звички дають сердечка')
chip('k_pin.png', '🔒', 'Батьківський режим за PIN')
chip('k_ok.png', '✅', 'Підтвердити все одним дотиком')
chip('k_spend.png', '🛍️', 'Витратити')
chip('k_save.png', '🐷', 'Накопичити')
chip('k_give.png', '💝', 'Подарувати')
chip('k_puzzle.png', '🧩', 'Мрія відкривається, як пазл')
chip('k_friends.png', '🧸', '36 друзів · 3 віки')
chip('k_name.png', '✏️', 'Своє ім\'я другові')
chip('k_stickers.png', '⭐', '36 наліпок')
chip('k_week.png', '📊', 'Підсумки тижня')
chip('k_gift.png', '🎁', 'Подарунок від батьків')
chip('k_sync.png', '📱', 'iPad і телефон — синхронно')

# --- хук (тісно) і фінал
def hook(name, lines, size=88):
    lh = int(size * 1.2); tw = max(width(l, size) for l in lines); pad = (52, 30); bw = int(tw + pad[0] * 2); bh = lh * len(lines) + pad[1] * 2 - 8
    pill = Image.new('RGBA', (bw, bh), (0, 0, 0, 0)); ImageDraw.Draw(pill).rounded_rectangle((0, 0, bw - 1, bh - 1), 60, fill=(255, 255, 255, 240))
    d = ImageDraw.Draw(pill)
    for i, l in enumerate(lines): text(d, ((bw - width(l, size)) / 2, pad[1] - 6 + i * lh), l, size, INK, 800)
    shadow_of(pill, 16, 12, 85).save(P + name)
hook('k_hook.png', ['Як навчити дитину', 'цінувати гроші?'])

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
S = 190; icon = Image.open('icons/icon-1024.png').convert('RGB').resize((S, S), Image.LANCZOS)
mk = Image.new('L', (S, S), 0); ImageDraw.Draw(mk).rounded_rectangle((0, 0, S - 1, S - 1), int(S * .225), fill=255)
ix, iy = (W - S) // 2, 96
sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((ix, iy + 14, ix + S, iy + S + 14), 52, fill=(120, 30, 80, 90)); sh = sh.filter(ImageFilter.GaussianBlur(20))
img = Image.alpha_composite(img, sh); img.paste(icon, (ix, iy), mk); d = ImageDraw.Draw(img)
text(d, ((W - width('Mini Money', 96, 900)) / 2, iy + S + 14), 'Mini Money', 96, INK, 900)
text(d, ((W - width('скарбничка для дітей', 52)) / 2, iy + S + 130), 'скарбничка для дітей', 52, PINK, 800)
img.save(P + 'o_title.png')
img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
def pill(y, t, size, fill, color):
    bw = width(t, size) + 90; bh = size + 52; x = (W - bw) / 2
    d.rounded_rectangle((x, y, x + bw, y + bh), bh // 2, fill=fill); text(d, ((W - width(t, size)) / 2, y + 22), t, size, color, 800)
pill(1560, 'Без реклами. Без покупок.', 54, (255, 255, 255, 235), INK)
pill(1690, 'Скоро в App Store', 50, PINK + (255,), (255, 255, 255))
img.save(P + 'o_pills.png')
print('ok')
