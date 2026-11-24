"""Монтаж динамічного рекламного ролика (~28 с, 1080×1920, у такт музиці 121,5 BPM).
Запуск: python3 tools/promo/build2.py <тека з файлами>. Потрібні в теці: clipA.mp4, clipB.mp4, iphone4-cfr.mp4 (запис екрана),
vo2/v1..v8.mp3 (фрази озвучки), music3.mp3, а також графіка з gfx2.py. Потрібні ffmpeg і numpy."""
import os, subprocess, sys, wave
import numpy as np

P = (sys.argv[1] if len(sys.argv) > 1 else '.').rstrip('/') + '/'
REC = P + 'iphone4-cfr.mp4'   # запис екрана, переведений у постійні 30 кадрів/с (ffmpeg -vf fps=30 -g 15): інакше швидкий -ss «плаває»
FFMPEG = '/opt/homebrew/bin/ffmpeg'
FFPROBE = '/opt/homebrew/bin/ffprobe'
B = 60 / 121.5                      # одна доля, с
X = 0.2                             # тривалість переходу
BEATS = [0, 7, 13, 22, 32, 36, 41, 46, 57]
BT = [n * B for n in BEATS]         # межі сцен, с
TRANS = ['slideleft', 'smoothleft', 'slideup', 'circleopen', 'smoothleft', 'slideleft', 'smoothright']
PW, PH, PX, PY = 740, 1608, 170, 270

def run(args):
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-1500:]); raise SystemExit(1)
def ff(*a): run([FFMPEG, '-v', 'error', '-y', *a])
def dur(path): return float(subprocess.check_output([FFPROBE, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode())

UP = 'scale=1080:1920:flags=lanczos,fps=30,format=yuv420p,setsar=1'
POP = "scale=w='iw*(0.55+0.45*min((t-{T})/0.2,1)+0.12*sin(3.14159*min(max((t-{T}),0)/0.34,1))*(1-min(max((t-{T}),0)/0.34,1)))':h=-1:eval=frame"

def scene_len(i):
    d = BT[i + 1] - BT[i]
    return d + (X / 2 if i in (0, len(BT) - 2) else X)

# ---------- сцени з телефоном ----------
# sub: (початок у записі, частка тривалості, обрізка (x,y,w,h) | None, заморозка, push)
PHONE_SCENES = {
    1: dict(bg='s1', title='t_s1', subs=[(9.6, 1, None, False, 0), (13.4, 1, None, False, 0)],
            chips=[('k_cards', 0.35, 1.55), ('k_hearts', 1.7, None)]),
    2: dict(bg='s2', title='t_s2', subs=[(18.0, 1, None, False, 0), (20.6, 1, None, False, 0)],
            chips=[('k_pin', 0.3, 2.2), ('k_ok', 2.45, None)]),
    3: dict(bg='s3', title='t_s3', subs=[(37.2, 1, None, False, 0), (43.25, 1, None, True, 0.06)],
            chips=[('k_spend', 3.0, None, (290, 905)), ('k_save', 3.5, None, (540, 1005)), ('k_give', 4.0, None, (800, 905))]),
    4: dict(bg='s4', title='t_s4', subs=[(7.5, 1, None, False, 0), (44.6, 1, None, False, 0)],
            chips=[('k_puzzle', 0.5, None)]),
    5: dict(bg='s5', title='t_s5', subs=[(31.2, 0.3, None, False, 0), (32.9, 0.3, None, False, 0), (35.2, 0.4, None, False, 0)],
            chips=[('k_friends', 0.15, 1.45), ('k_name', 1.5, None)]),
    6: dict(bg='s6', title='t_s6', subs=[(50.0, 0.34, None, False, 0), (28.0, 0.33, None, False, 0), (53.1, 0.33, None, False, 0)],
            chips=[('k_stickers', 0.05, 0.95), ('k_week', 0.95, 1.85), ('k_gift', 1.85, None)]),
}

def build_phone_scene(i, spec):
    L = scene_len(i); inputs = []; fc = []; n = 0
    def add(*a): nonlocal n; inputs.extend(a); n += 1; return n - 1
    ibg = add('-loop', '1', '-t', f'{L:.3f}', '-i', P + f"bg_{spec['bg']}.png")
    ish = add('-loop', '1', '-t', f'{L:.3f}', '-i', P + 'ph-shadow.png')
    imk = add('-loop', '1', '-t', f'{L:.3f}', '-i', P + 'ph-mask.png')
    itl = add('-loop', '1', '-t', f'{L:.3f}', '-i', P + spec['title'] + '.png')
    total_w = sum(s[1] for s in spec['subs']); labels = []
    for k, (src, w, crop, freeze, push) in enumerate(spec['subs']):
        ln = L * w / total_w
        iv = add('-ss', f'{src}', '-t', f'{ln + 0.1:.3f}', '-i', REC)
        c = f'crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]},' if crop else ''
        chain = f'[{iv}:v]{c}scale={PW}:{PH}:flags=lanczos,format=rgba,setsar=1,'
        if freeze: chain += f'trim=end_frame=1,loop=loop=-1:size=1:start=0,fps=30,setpts=N/30/TB,trim=duration={ln:.3f},'
        else: chain += f'fps=30,trim=duration={ln:.3f},'
        chain += 'setpts=PTS-STARTPTS'
        if push: chain += f",scale=w='{PW}*(1+{push}*t/{ln:.3f})':h=-1:eval=frame,crop={PW}:{PH}:(in_w-{PW})/2:0"
        fc.append(chain + f'[s{k}]'); labels.append(f'[s{k}]')
    fc.append(''.join(labels) + f'concat=n={len(labels)}:v=1:a=0[ph0]')
    fc.append(f'[ph0][{imk}:v]alphamerge[pm]')
    fc.append(f'[{ibg}:v]fps=30,format=rgba[b0];[b0][{ish}:v]overlay=0:0[b1];[b1][pm]overlay={PX}:{PY}[b2];[b2][{itl}:v]overlay=0:0[b3]')
    last = 'b3'
    for j, ch in enumerate(spec['chips']):
        name, t0, t1 = ch[0], ch[1], ch[2]; pos = ch[3] if len(ch) > 3 else (540, 1740)
        end = (t1 if t1 else L - 0.05)
        ic = add('-loop', '1', '-itsoffset', f'{t0}', '-t', f'{end - t0:.3f}', '-i', P + name + '.png')
        fc.append(f"[{ic}:v]format=rgba,{POP.format(T=t0)}[cp{j}]")
        fc.append(f"[{last}][cp{j}]overlay=x={pos[0]}-w/2:y={pos[1]}-h/2:eof_action=pass[o{j}]"); last = f'o{j}'
    fc.append(f'[{last}]format=yuv420p,fps=30[v]')
    out = P + f'sc{i}.mp4'
    ff(*inputs, '-filter_complex', ';'.join(fc), '-map', '[v]', '-t', f'{L:.3f}', '-an', '-c:v', 'libx264', '-crf', '15', '-preset', 'fast', out)
    return out

def build_hook():
    L = scene_len(0)
    ff('-t', f'{L:.3f}', '-i', P + 'clipA.mp4', '-loop', '1', '-itsoffset', '0.2', '-t', f'{L - 0.2:.3f}', '-i', P + 'k_hook.png', '-filter_complex',
       f"[0:v]{UP}[v0];[1:v]format=rgba,{POP.format(T=0.2)}[k];[v0][k]overlay=x=540-w/2:y=440-h/2:eof_action=pass,format=yuv420p[v]",
       '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '15', '-preset', 'fast', P + 'sc0.mp4')

def build_outro():
    i = len(BT) - 2; L = scene_len(i)
    ff('-i', P + 'clipB.mp4', '-loop', '1', '-itsoffset', '0.35', '-t', f'{L - 0.35:.3f}', '-i', P + 'o_title.png',
       '-loop', '1', '-itsoffset', '1.3', '-t', f'{L - 1.3:.3f}', '-i', P + 'o_pills.png', '-filter_complex',
       f"[0:v]{UP},tpad=stop_mode=clone:stop_duration=1.5[v0];[1:v]format=rgba,fade=t=in:st=0.35:d=0.35:alpha=1[a];[2:v]format=rgba,fade=t=in:st=1.3:d=0.3:alpha=1[b];"
       f"[v0][a]overlay=0:0:eof_action=pass[x];[x][b]overlay=0:0:eof_action=pass,format=yuv420p[v]",
       '-map', '[v]', '-t', f'{L:.3f}', '-an', '-c:v', 'libx264', '-crf', '15', '-preset', 'fast', P + f'sc{i}.mp4')

# ---------- звук ----------
def write_wav(path, data, sr=44100):
    data = np.clip(data, -1, 1); st = np.stack([data, data], 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st * 32767).astype('<i2').tobytes())

def make_sfx(total, sr=44100):
    rng = np.random.default_rng(7); buf = np.zeros(int(total * sr) + sr)
    def put(t, sig, g=1.0):
        s = int(t * sr); buf[s:s + len(sig)] += sig[:len(buf) - s] * g
    def whoosh():
        n = int(0.38 * sr); x = rng.standard_normal(n); f = np.fft.rfft(x); fr = np.fft.rfftfreq(n, 1 / sr)
        f *= np.exp(-((fr - 2200) / 1700) ** 2); y = np.fft.irfft(f, n); env = np.sin(np.linspace(0, np.pi, n)) ** 2
        return y / np.abs(y).max() * env
    def pop():
        n = int(0.11 * sr); t = np.arange(n) / sr; fr = 620 + 900 * t / 0.11
        return np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t * 38)
    def ding():
        n = int(0.7 * sr); t = np.arange(n) / sr
        return (np.sin(2 * np.pi * 1568 * t) + 0.5 * np.sin(2 * np.pi * 2093 * t) + 0.25 * np.sin(2 * np.pi * 3136 * t)) * np.exp(-t * 6) * 0.5
    wh, po, di = whoosh(), pop(), ding()
    for b in BT[1:-1]: put(b - 0.22, wh, 0.55)
    chip_times = []
    for i, spec in PHONE_SCENES.items():
        for ch in spec['chips']: chip_times.append(BT[i] - (X / 2 if i else 0) + ch[1])
    chip_times.append(0.2)
    for t in chip_times: put(t, po, 0.5)
    put(BT[3] + 0.5, di, 0.7); put(BT[3] + 0.62, di, 0.5)      # дзвінок монеток у сцені 3
    return buf

def build_audio(total):
    # озвучка по фразах: обрізати тишу, підігнати темп під слот сцени
    slots = [BT[i + 1] - BT[i] for i in range(8)]
    starts = [BT[i] + (0.12 if i == 0 else 0.1) for i in range(8)]
    inputs, fc, labels = [], [], []
    for i in range(8):
        src = P + f'vo2/v{i + 1}.mp3'; tmp = P + f'vo2/t{i + 1}.wav'
        ff('-i', src, '-af', 'silenceremove=start_periods=1:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_threshold=-42dB,areverse',
           '-ar', '44100', '-ac', '2', tmp)
        d = dur(tmp); f = min(1.3, max(1.05, d / (slots[i] - 0.14)))
        fit = P + f'vo2/f{i + 1}.wav'; ff('-i', tmp, '-af', f'atempo={f:.3f}', fit)
        print(f'  голос {i + 1}: {d:.2f} с → темп ×{f:.2f} → {dur(fit):.2f} с (слот {slots[i]:.2f} с)')
        inputs += ['-i', fit]
        fc.append(f'[{i}:a]afade=t=in:d=0.015,adelay={int(starts[i] * 1000)}|{int(starts[i] * 1000)}[p{i}]'); labels.append(f'[p{i}]')
    write_wav(P + 'sfx.wav', make_sfx(total))
    inputs += ['-i', P + 'music3.mp3', '-i', P + 'sfx.wav']
    n = 8
    fc.append(''.join(labels) + f'amix=inputs=8:normalize=0,apad=whole_dur={total:.3f},asplit=2[vo][vo2]')
    fc.append(f'[{n}:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=start=0.08:end={0.08 + total:.3f},asetpts=PTS-STARTPTS,volume=0.5,afade=t=in:d=0.2,afade=t=out:st={total - 1.6:.3f}:d=1.6[mus]')
    fc.append('[mus][vo2]sidechaincompress=threshold=0.02:ratio=9:attack=10:release=300[duck]')
    fc.append(f'[{n + 1}:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:{total:.3f},volume=0.9[sfx]')
    fc.append('[vo][duck][sfx]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[a]')
    ff(*inputs, '-filter_complex', ';'.join(fc), '-map', '[a]', '-t', f'{total:.3f}', '-c:a', 'aac', '-b:a', '192k', P + 'audio2.m4a')

def main():
    print('сцени…')
    build_hook()
    for i, spec in PHONE_SCENES.items(): build_phone_scene(i, spec)
    build_outro()
    n = len(BT) - 1; fc = []; acc = '[0:v]'
    for i in range(n - 1):
        off = BT[i + 1] - X / 2
        out = '[v]' if i == n - 2 else f'[x{i}]'
        fc.append(f'{acc}[{i + 1}:v]xfade=transition={TRANS[i]}:duration={X}:offset={off:.4f}{out}'); acc = out
    total = BT[-1]
    print('склейка…')
    ff(*sum([['-i', P + f'sc{i}.mp4'] for i in range(n)], []), '-filter_complex', ';'.join(fc), '-map', '[v]', '-t', f'{total:.3f}', '-an',
       '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', P + 'video2.mp4')
    print('звук…'); build_audio(total)
    ff('-i', P + 'video2.mp4', '-i', P + 'audio2.m4a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', P + 'ad2-9x16.mp4')
    print('готово', dur(P + 'ad2-9x16.mp4'))

if __name__ == '__main__': main()
