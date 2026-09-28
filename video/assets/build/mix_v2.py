import subprocess, json, re
S='/tmp/claude-0/-home-user-Wishhub/1f2cd0c3-b8b6-51e2-841f-717bab564505/scratchpad'
FF=S+'/py/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'; O=S+'/v2'; VO=S+'/vo'; A=S+'/audio'
tl=json.load(open(O+'/timeline.json')); st=tl['starts']; T=tl['total']
seg={n:i for i,(n,d,tr) in enumerate(tl['seg'])}
at=lambda n,off: st[seg[n]]+off
# (file, trim_start, trim_end or None, time)
vo=[('01',0,None,at('01',0.6)),('02',0,None,at('02',4.7)),('03',0,None,at('03',0.9)),
    ('04',0,0.78,at('04',0.3)),('04',0.78,1.55,at('04',2.1)),('04',1.55,None,at('04',4.1)),
    ('05',0,1.25,at('06',0.4)),('05',1.25,2.1,at('06',1.55)),('05',2.1,None,at('06',2.35)),
    ('06',0,None,at('09',0.3)),('07',0,None,at('12',0.5)),('08',0,None,at('13',0.9))]
wh=[at('03',-0.35),at('04',-0.3),at('09',-0.3),at('12',-0.35)]   # whooshes into key motion scenes
chime=at('02',4.5)
ins=[]; fc=[]; labs=[]
for i,(n,a,b,t) in enumerate(vo):
    ins+=['-i',f'{VO}/vo-{n}.mp3']; tr=f"atrim={a}"+(f":{b}" if b else "")
    fc.append(f"[{i}:a]{tr},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,adelay={int(t*1000)}:all=1[v{i}]"); labs.append(f"[v{i}]")
k=len(vo)
fc.append(f"{''.join(labs)}amix=inputs={len(labs)}:normalize=0,apad,atrim=0:{T:.3f},volume=12dB[vo]")
wl=[]
for j,t in enumerate(wh):
    ins+=['-i',A+'/whoosh.wav']; fc.append(f"[{k+j}:a]volume=0.35,adelay={int(t*1000)}:all=1[w{j}]"); wl.append(f"[w{j}]")
ins+=['-i',A+'/chime.wav']; fc.append(f"[{k+len(wh)}:a]volume=0.45,adelay={int(chime*1000)}:all=1[ch]"); wl.append('[ch]')
fc.append(f"{''.join(wl)}amix=inputs={len(wl)}:normalize=0,apad,atrim=0:{T:.3f}[sfx]")
p=k+len(wh)+1
ins+=['-i',A+'/pad.wav']
# pad: quiet under the hook, blooms at the turn, fades at the end
fc.append(f"[{p}:a]atrim=0:{T:.3f},volume='0.10+0.22*min(max((t-{at('02',3.5):.2f})/3\\,0)\\,1)':eval=frame,afade=out:st={T-2.5:.2f}:d=2.5[pad]")
ins+=['-i',O+'/picture_amb.mp4']; q=p+1
fc.append(f"[{q}:a]aresample=48000,volume=3dB[amb]")
fc.append("[amb][pad]amix=inputs=2:normalize=0[bed]")
fc.append("[vo]asplit=2[vox][key]")
fc.append("[bed][key]sidechaincompress=threshold=0.02:ratio=6:attack=25:release=450[bedd]")
fc.append("[bedd][vox][sfx]amix=inputs=3:normalize=0[mix]")
graph=';'.join(fc)
def ffrun(extra): return subprocess.run([FF,'-hide_banner','-y']+ins+['-filter_complex',graph+extra],capture_output=True,text=True)
# pass 1: measure loudness
r=ffrun(";[mix]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[o]" ); 
r=subprocess.run([FF,'-hide_banner','-y']+ins+['-filter_complex',graph+";[mix]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[o]",'-map','[o]','-f','null','-'],capture_output=True,text=True)
m=json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}',r.stderr).group(0))
ln=f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
out=S+'/wishhub-usa-full-draft-v2.mp4'
r=subprocess.run([FF,'-loglevel','error','-y']+ins+['-filter_complex',graph+f";[mix]{ln},aresample=48000[o]",'-map',f'{q}:v','-map','[o]','-c:v','copy','-c:a','aac','-b:a','192k','-t',f'{T:.3f}','-movflags','+faststart',out],capture_output=True,text=True)
print(r.stderr[-2000:]); print('measured',m['input_i'],'->',out)
