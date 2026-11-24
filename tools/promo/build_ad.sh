#!/bin/bash
set -e
cd "$(dirname "$0")"
F="ffmpeg -v error -y"
UP="scale=1080:1920:flags=lanczos,fps=30,format=yuv420p,setsar=1"
# s1/s5: сцени з героями
$F -t 3.0 -i clipA.mp4 -vf "$UP" -an -c:v libx264 -crf 14 -preset fast s1.mp4
$F -i clipB.mp4 -vf "$UP,tpad=stop_mode=clone:stop_duration=1.3" -t 6.1 -an -c:v libx264 -crf 14 -preset fast s5.mp4
# s2..s4: запис екрана в рамці телефона на рожевому тлі
phone() { # name ss dur
  $F -loop 1 -t $3 -i bg.png -ss $2 -t $3 -i iphone-raw.mov -loop 1 -t $3 -i phone-mask.png -loop 1 -t $3 -i phone-shadow.png -filter_complex \
  "[0:v]fps=30,format=rgba[bg];[1:v]fps=30,scale=718:1560:flags=lanczos,format=rgba[ph];[2:v]format=gray[mk];[ph][mk]alphamerge[pm];[3:v]format=rgba[sh];[bg][sh]overlay=0:0[b1];[b1][pm]overlay=(W-w)/2:300,format=yuv420p,setsar=1[v]" \
  -map "[v]" -an -c:v libx264 -crf 14 -preset fast $1.mp4
}
phone s2 7.6 2.3
phone s3 12.0 2.8
phone s4 16.3 2.4
# склейка з короткими затемненнями
$F -i s1.mp4 -i s2.mp4 -i s3.mp4 -i s4.mp4 -i s5.mp4 -filter_complex \
"[0][1]xfade=transition=fade:duration=0.15:offset=2.85[a];[a][2]xfade=transition=fade:duration=0.15:offset=5.0[b];[b][3]xfade=transition=fade:duration=0.15:offset=7.65[c];[c][4]xfade=transition=fade:duration=0.15:offset=9.9[v]" \
-map "[v]" -an -c:v libx264 -crf 14 -preset fast base.mp4
# підписи
cap() { echo "-loop 1 -itsoffset $2 -t $3 -i $1"; }
$F -i base.mp4 $(cap c1.png 0.2 2.6) $(cap c2.png 3.0 4.6) $(cap c3.png 7.9 2.1) $(cap c4a.png 10.4 5.6) $(cap c4b.png 11.2 4.8) -filter_complex \
"[1:v]format=rgba,fade=t=in:st=0.2:d=0.25:alpha=1,fade=t=out:st=2.55:d=0.25:alpha=1[k1];\
[2:v]format=rgba,fade=t=in:st=3.0:d=0.25:alpha=1,fade=t=out:st=7.35:d=0.25:alpha=1[k2];\
[3:v]format=rgba,fade=t=in:st=7.9:d=0.25:alpha=1,fade=t=out:st=9.75:d=0.25:alpha=1[k3];\
[4:v]format=rgba,fade=t=in:st=10.4:d=0.35:alpha=1[k4];\
[5:v]format=rgba,fade=t=in:st=11.2:d=0.3:alpha=1[k5];\
[0:v][k1]overlay=0:0:eof_action=pass[o1];[o1][k2]overlay=0:0:eof_action=pass[o2];[o2][k3]overlay=0:0:eof_action=pass[o3];[o3][k4]overlay=0:0:eof_action=pass[o4];[o4][k5]overlay=0:0:eof_action=pass,format=yuv420p[v]" \
-map "[v]" -t 16 -an -c:v libx264 -crf 14 -preset fast video.mp4
# звук: озвучка по фразах + музика з приглушенням
$F -i vo.mp3 -i music.mp3 -filter_complex \
"[0:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=4[v1][v2][v3][v4];\
[v1]atrim=0:2.55,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=2.5:d=0.05,adelay=250|250[p1];\
[v2]atrim=2.75:4.53,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=1.73:d=0.05,adelay=3200|3200[p2];\
[v3]atrim=4.53:6.48,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=1.9:d=0.05,adelay=7950|7950[p3];\
[v4]atrim=6.48:11.52,asetpts=PTS-STARTPTS,afade=t=in:d=0.02,adelay=10600|10600[p4];\
[p1][p2][p3][p4]amix=inputs=4:normalize=0,apad=whole_dur=16,asplit=2[vo][vo2];\
[1:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:16,asetpts=PTS-STARTPTS,volume=0.38,afade=t=in:d=0.4,afade=t=out:st=14.4:d=1.6[mus];\
[mus][vo2]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350[duck];\
[vo][duck]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
-map "[a]" -t 16 -c:a aac -b:a 192k audio.m4a
$F -i video.mp4 -i audio.m4a -c:v copy -c:a copy -shortest -movflags +faststart ad-9x16.mp4
ls -la ad-9x16.mp4; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of csv=p=0 ad-9x16.mp4
