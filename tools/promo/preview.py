import subprocess, sys
P=(sys.argv[1] if len(sys.argv) > 1 else '.').rstrip('/') + '/'
CUTS=[(9.5,2.0),(13.3,2.0),(18.0,2.4),(20.5,2.5),(25.0,2.0),(27.5,1.8),(31.0,5.4),(37.2,3.5),(44.0,3.0),(49.6,2.8)]
T=sum(d for _,d in CUTS)
def make(src,size,out):
    w,h=size
    ins=[]; fc=[]
    for i,(s,d) in enumerate(CUTS):
        ins+=['-ss',str(s),'-t',f'{d:.2f}','-i',P+src]
        sc=f'scale={w}:{h+5 if h==1920 else h}:flags=lanczos,crop={w}:{h}' if h==1920 else f'scale={w}:{h}:flags=lanczos'
        fc.append(f'[{i}:v]fps=30,{sc},format=yuv420p,setsar=1,setpts=PTS-STARTPTS[v{i}]')
    ins+=['-i',P+'music3.mp3']; n=len(CUTS)
    fc.append(''.join(f'[v{i}]' for i in range(n))+f'concat=n={n}:v=1:a=0,fade=t=in:d=0.3,fade=t=out:st={T-0.6:.2f}:d=0.6[v]')
    fc.append(f'[{n}:a]atrim=start=0.08:end={0.08+T:.2f},asetpts=PTS-STARTPTS,volume=0.5,afade=t=in:d=0.5,afade=t=out:st={T-2:.2f}:d=2,aformat=sample_rates=48000:channel_layouts=stereo,loudnorm=I=-18:TP=-2,aresample=48000,aformat=channel_layouts=stereo[a]')
    r=subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-y',*ins,'-filter_complex',';'.join(fc),'-map','[v]','-map','[a]','-t',f'{T:.2f}','-c:v','libx264','-profile:v','high','-level','4.2','-crf','16','-preset','slow','-r','30','-c:a','aac','-b:a','256k','-ar','48000','-movflags','+faststart',P+out],capture_output=True,text=True)
    if r.returncode: print(r.stderr[-1200:]); sys.exit(1)
make('iphone4-cfr.mp4',(886,1920),'preview2-iphone-886x1920.mp4')
make('ipad4-cfr.mp4',(1200,1600),'preview2-ipad-1200x1600.mp4')
print('total',T)
