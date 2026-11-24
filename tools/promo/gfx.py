from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont
import os
P=os.path.dirname(os.path.abspath(__file__))+'/'
W,H=1080,1920
FONTS={}
def font(kind,size,w=800):
    k=(kind,size,w)
    if k not in FONTS:
        f=ImageFont.truetype(P+f'nunito-{kind}.ttf',size); f.set_variation_by_axes([w]); FONTS[k]=f
    return FONTS[k]
CMAP={k:set(TTFont(P+f'nunito-{k}.ttf').getBestCmap().keys()) for k in ('cyrillic','latin')}
SYS=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',60)
def pick(ch,size,w):
    c=ord(ch)
    if c in CMAP['cyrillic'] and c>0x7f: return font('cyrillic',size,w)
    if c in CMAP['latin']: return font('latin',size,w)
    return ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',size)
def width(text,size,w=800): return sum(pick(c,size,w).getlength(c) for c in text)
def draw_text(d,xy,text,size,fill,w=800,anchor='l'):
    x,y=xy; tw=width(text,size,w)
    if anchor=='m': x-=tw/2
    for ch in text:
        f=pick(ch,size,w); d.text((x,y),ch,font=f,fill=fill); x+=f.getlength(ch)
    return tw
def wrap(text,size,maxw,w=800):
    lines=[];cur=''
    for word in text.split(' '):
        t=(cur+' '+word).strip()
        if width(t,size,w)<=maxw: cur=t
        else: lines.append(cur); cur=word
    lines.append(cur); return lines

def gradient(top,bot):
    g=Image.new('RGB',(W,H))
    for y in range(H):
        t=y/(H-1); g.paste(tuple(round(a+(b-a)*t) for a,b in zip(top,bot)),(0,y,W,y+1))
    return g
gradient((255,236,246),(255,208,230)).save(P+'bg.png')

# рамка телефона: маска й тінь
PW,PH=718,1560; R=92
m=Image.new('L',(PW,PH),0); ImageDraw.Draw(m).rounded_rectangle((0,0,PW-1,PH-1),R,fill=255); m.save(P+'phone-mask.png')
sh=Image.new('RGBA',(W,H),(0,0,0,0)); sm=Image.new('L',(W,H),0)
x0=(W-PW)//2; y0=300
ImageDraw.Draw(sm).rounded_rectangle((x0,y0+26,x0+PW,y0+PH+26),R,fill=95); sm=sm.filter(ImageFilter.GaussianBlur(34)); sh.putalpha(sm)
# тонка «рамка» навколо екрана
ring=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(ring).rounded_rectangle((x0-6,y0-6,x0+PW+6,y0+PH+6),R+6,outline=(255,255,255,255),width=8)
Image.alpha_composite(sh,ring).save(P+'phone-shadow.png')

def pill_caption(name,lines,y,size=74,color=(74,29,74),fill=(255,255,255,235),pad=(46,26)):
    img=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
    lh=int(size*1.22); tw=max(width(l,size) for l in lines); bw=tw+pad[0]*2; bh=lh*len(lines)+pad[1]*2-10
    x=(W-bw)/2
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((x,y+10,x+bw,y+bh+10),56,fill=(120,30,80,60)); sh=sh.filter(ImageFilter.GaussianBlur(14))
    img=Image.alpha_composite(img,sh); d=ImageDraw.Draw(img)
    d.rounded_rectangle((x,y,x+bw,y+bh),56,fill=fill)
    for i,l in enumerate(lines): draw_text(d,(W/2,y+pad[1]-4+i*lh),l,size,color,800,'m')
    img.save(P+name)

# 1 хук (над героями)
pill_caption('c1.png',['Як навчити дитину','цінувати гроші?'],170,size=84)
# 2 і 3 — над телефоном
def arrow_caption(name,a,b):
    img=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(img); size=78
    ta=width(a,size); tb=width(b,size); aw=84; gap=24; tw=ta+aw+tb+gap*2; pad=52
    bw=tw+pad*2; bh=size+62; x=(W-bw)/2; y=84
    sh=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((x,y+10,x+bw,y+bh+10),56,fill=(120,30,80,60)); sh=sh.filter(ImageFilter.GaussianBlur(14))
    img=Image.alpha_composite(img,sh); d=ImageDraw.Draw(img)
    d.rounded_rectangle((x,y,x+bw,y+bh),56,fill=(255,255,255,240))
    cx=x+pad; ty=y+22
    draw_text(d,(cx,ty),a,size,(74,29,74)); cx+=ta+gap
    # стрілка
    ay=y+bh/2; d.line((cx,ay,cx+aw-26,ay),fill=(229,64,138),width=14)
    d.polygon([(cx+aw-8,ay),(cx+aw-38,ay-24),(cx+aw-38,ay+24)],fill=(229,64,138)); cx+=aw+gap
    draw_text(d,(cx,ty),b,size,(229,64,138))
    img.save(P+name)
arrow_caption('c2.png','Справи','монетки')
arrow_caption('c3.png','Монетки','мрія')

# 4 фінал
img=Image.new('RGBA',(W,H),(0,0,0,0))
S=190; icon=Image.open('icons/icon-1024.png').convert('RGB').resize((S,S),Image.LANCZOS)
mk=Image.new('L',(S,S),0); ImageDraw.Draw(mk).rounded_rectangle((0,0,S-1,S-1),int(S*.225),fill=255)
ix,iy=(W-S)//2,96
sh=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((ix,iy+14,ix+S,iy+S+14),56,fill=(120,30,80,90)); sh=sh.filter(ImageFilter.GaussianBlur(20))
img=Image.alpha_composite(img,sh); img.paste(icon,(ix,iy),mk); d=ImageDraw.Draw(img)
draw_text(d,(W/2,iy+S+14),'Mini Money',96,(74,29,74),900,'m')
draw_text(d,(W/2,iy+S+130),'скарбничка для дітей',52,(229,64,138),800,'m')
img.save(P+'c4a.png')
img=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(img)
def pill(y,text,size,fill,color):
    tw=width(text,size); bw=tw+90; bh=size+52; x=(W-bw)/2
    d.rounded_rectangle((x,y,x+bw,y+bh),bh//2,fill=fill); draw_text(d,(W/2,y+22),text,size,color,800,'m')
pill(1560,'Без реклами. Без покупок.',54,(255,255,255,235),(74,29,74))
pill(1690,'Скоро в App Store',50,(229,64,138,255),(255,255,255))
img.save(P+'c4b.png')
print('ok')
