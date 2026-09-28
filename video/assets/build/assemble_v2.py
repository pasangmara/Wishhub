import subprocess, json, os, sys
S='/tmp/claude-0/-home-user-Wishhub/1f2cd0c3-b8b6-51e2-841f-717bab564505/scratchpad'
FF=S+'/py/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
U='/root/.claude/uploads/1f2cd0c3-b8b6-51e2-841f-717bab564505'
M=S+'/mg'; O=S+'/v2'; VO=S+'/vo'
C={'c3':'e9b48829-Glowing_butterfly_emerges_from_l__20260928052820.mp4','c6':'aa5eb7b1-Woman_using_laptop_at_desk_20260928052824.mp4',
   'c7':'aab696f0-Man_smiling_at_smartphone_20260928052857.mp4','c8':'03a37781-Woman_reading_email_on_laptop_20260928055114.mp4',
   'c9':'c31cae71-Office_team_celebrating_with_cake_20260928055117.mp4','c10':'b1955650-Woman_smiling_by_office_window_20260928055138.mp4'}
C={k:U+'/'+v for k,v in C.items()}
V="scale=1920:1080:flags=lanczos,fps=24,format=yuv420p,setsar=1"
AF="aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo"
ENC=['-c:v','libx264','-crf','17','-preset','medium','-c:a','aac','-b:a','192k','-ar','48000']
def run(a): subprocess.run([FF,'-loglevel','error','-y']+a,check=True)
def mg(out,src,d): run(['-i',src,'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-vf',V,'-af',AF,'-map','0:v','-map','1:a','-t',str(d)]+ENC+[out])
def slide_overlay(x_final,y,t0): return f"overlay=x='{x_final}+500*pow(max(0\\,1-(t-{t0})/0.45)\\,2)':y={y}:enable='gte(t,{t0})'"
seg=[]
# 1 hook (existing 10s hook cut, upscaled)
run(['-i',S+'/wishhub-hook-roughcut.mp4','-vf',V,'-af',AF,'-t','10']+ENC+[O+'/01.mp4']); seg.append(('01',10.0,None))
# 2 turn: C3 3.5-8.0 normal + 8.0-10.0 slowed 1.5x, slow push-in, logo + tagline, no freeze
run(['-ss','3.5','-t','6.5','-i',C['c3'],'-loop','1','-t','7.5','-i',M+'/logo_1080.png','-loop','1','-t','7.5','-i',M+'/turn_text_1080.png','-filter_complex',
 f"[0:v]split[a][b];[a]trim=0:4.5,setpts=PTS-STARTPTS[a1];[b]trim=4.5:6.5,setpts=(PTS-STARTPTS)*1.5[b1];[a1][b1]concat=n=2:v=1:a=0,{V},"
 "scale=w='1920*(1+0.05*t/7.5)':h=-2:eval=frame:flags=bicubic,crop=1920:1080,fade=in:st=0:d=0.4[c];"
 "[1:v]format=rgba,fade=in:st=4.6:d=0.7:alpha=1[l];[2:v]format=rgba,fade=in:st=5.3:d=0.6:alpha=1[t];[c][l]overlay=0:0[c2];[c2][t]overlay=0:0,format=yuv420p[v];"
 f"[0:a]{AF},asplit[x][y];[x]atrim=0:4.5,asetpts=PTS-STARTPTS[x1];[y]atrim=4.5:6.5,asetpts=PTS-STARTPTS,atempo=0.6667[y1];[x1][y1]concat=n=2:v=0:a=1,afade=in:d=0.4[a]",
 '-map','[v]','-map','[a]','-t','7.5']+ENC+[O+'/02.mp4']); seg.append(('02',7.5,('fade',0.3)))
mg(O+'/03.mp4',M+'/seg_showcase.mp4',10.8); seg.append(('03',10.8,('fade',0.6)))
mg(O+'/04.mp4',M+'/seg_how.mp4',8.0); seg.append(('04',8.0,('fade',0.5)))
run(['-ss','7.0','-t','3.0','-i',C['c6'],'-vf','delogo=x=295:y=574:w=42:h=54,'+V,'-af',AF,'-t','3.0']+ENC+[O+'/05.mp4']); seg.append(('05',3.0,('fade',0.4)))
mg(O+'/06.mp4',M+'/seg_brand.mp4',5.0); seg.append(('06',5.0,('fade',0.4)))
run(['-ss','4.0','-t','6.0','-i',C['c7'],'-loop','1','-t','6','-i',M+'/delivered_c7.png','-filter_complex',
 f"[0:v]{V}[b];[1:v]format=rgba,fade=in:st=0.5:d=0.3:alpha=1,fade=out:st=5.2:d=0.4:alpha=1[o];[b][o]{slide_overlay(1920-760,64,0.5)},format=yuv420p[v]",
 '-map','[v]','-map','0:a','-af',AF,'-t','6']+ENC+[O+'/07.mp4']); seg.append(('07',6.0,('fade',0.4)))
run(['-ss','0','-t','5.5','-i',C['c9'],'-vf',V,'-af',AF,'-t','5.5']+ENC+[O+'/08.mp4']); seg.append(('08',5.5,('fade',0.4)))
mg(O+'/09.mp4',M+'/seg_dash.mp4',8.0); seg.append(('09',8.0,('fade',0.5)))
run(['-ss','4.5','-t','5.5','-i',C['c8'],'-loop','1','-t','5.5','-i',M+'/mail_c8.png','-filter_complex',
 f"[0:v]{V}[b];[1:v]format=rgba,fade=in:st=0.6:d=0.3:alpha=1[o];[b][o]{slide_overlay(1920-760,70,0.6)},format=yuv420p[v]",
 '-map','[v]','-map','0:a','-af',AF,'-t','5.5']+ENC+[O+'/10.mp4']); seg.append(('10',5.5,('fade',0.4)))
run(['-ss','3.5','-t','6.5','-i',C['c10'],'-loop','1','-t','6.5','-i',M+'/c10_text.png','-filter_complex',
 f"[0:v]{V}[b];[1:v]format=rgba,fade=in:st=0.8:d=0.7:alpha=1,fade=out:st=5.2:d=0.8:alpha=1[o];[b][o]overlay=0:0,format=yuv420p[v]",
 '-map','[v]','-map','0:a','-af',AF,'-t','6.5']+ENC+[O+'/11.mp4']); seg.append(('11',6.5,('fade',0.4)))
mg(O+'/12.mp4',M+'/seg_offer.mp4',8.0); seg.append(('12',8.0,('fadewhite',0.6)))
mg(O+'/13.mp4',M+'/seg_end.mp4',6.0); seg.append(('13',6.0,('fade',0.6)))
# timeline
starts=[]; L=0.0
for i,(n,d,tr) in enumerate(seg):
    if i==0: starts.append(0.0); L=d
    else: off=L-tr[1]; starts.append(off); L=off+d
total=L
json.dump({'starts':starts,'total':total,'seg':seg},open(O+'/timeline.json','w'),indent=1)
# video + ambient chain with xfade / acrossfade
ins=[]; 
for n,d,tr in seg: ins+=['-i',f'{O}/{n}.mp4']
fc=[]; vprev='[0:v]'; aprev='[0:a]'; L=seg[0][1]
for i in range(1,len(seg)):
    n,d,(tt,td)=seg[i]; off=L-td
    fc.append(f"{vprev}[{i}:v]xfade=transition={tt}:duration={td}:offset={off:.3f}[v{i}]")
    fc.append(f"{aprev}[{i}:a]acrossfade=d={td}:c1=tri:c2=tri[a{i}]")
    vprev=f'[v{i}]'; aprev=f'[a{i}]'; L=off+d
run(ins+['-filter_complex',';'.join(fc),'-map',vprev,'-map',aprev]+ENC+[O+'/picture_amb.mp4'])
print(json.dumps({'starts':[round(s,2) for s in starts],'total':round(total,2)}))
