"""Assemble the 90s Vingo diaspora promo with ffmpeg.

Inputs: the 11 Google Flow clips, rendered graphics (gfx.py), n8n voiceover (vo/), Mixkit music + SFX.
Outputs: ../output/vingo_promo_90s_16x9.mp4 and ../output/vingo_promo_90s_9x16.mp4
"""
import json
import re
import subprocess
import sys
from pathlib import Path

FF = "/root/bin/ffmpeg"
ROOT = Path(__file__).resolve().parent
CLIPS = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "renders" / "clips"
OUT = ROOT.parent / "output"
X = 0.2  # cross-dissolve length (s)
GRADE = "eq=contrast=1.03:saturation=1.06,unsharp=5:5:0.5"


SCREENS = ROOT.parent / "renders" / "clips_screen"


def clip(name):
    m = sorted(SCREENS.glob(f"*{name}*.mp4")) or sorted(CLIPS.glob(f"*{name}*.mp4"))
    if not m:
        raise SystemExit(f"missing clip: {name}")
    return str(m[0])


# (kind, source, in-point, slot seconds, video filter extra, native-audio gain dB or None)
SEGMENTS = [
    ("clip", "Woman_scrolling_smartphone", 0.5, 7.0, "", 6),
    ("clip", "Daughter_and_mother_making_card", 0.5, 7.0, "", 3),
    ("clip", "Daughter_clicks_glowing_screen", 1.0, 7.0, "", 0),
    ("gfx", "site_alpona", 0, 4.0, "", None),
    ("clip", "Thread_stitching_into_lotus", 0.0, 7.0, "speed:1.4", -4),
    ("clip", "Mother_smiling_at_typing_daughter", 0.3, 6.0, "crop=806:453:474:0", None),  # crop hides the fake news-site laptop screen
    ("gfx", "smart_resize", 0, 4.0, "", None),
    ("gfx", "templates", 0, 6.0, "", None),
    ("clip", "Shopkeeper_tapes_poster", 3.0, 7.0, "", -3),
    ("clip", "Man_tapping_phone_screen", 2.0, 6.0, "", 0),
    ("clip", "People_laughing_at_screen", 2.5, 5.0, "", None),  # its dialogue doesn't fit the story: muted
    ("clip", "Crane_revealing_festival_crowd", 1.5, 7.0, "", -2),
    ("clip", "Two_women_wave_on_video-call", 0.5, 2.5, "", None),  # says wrong names: muted
    ("clip", "Woman_laughing_through_happy_tears", 0.0, 4.0, "", 5),  # "Mashallah, ki sundor!"
    ("gfx", "endcard", 0, 10.5, "", None),
]

# overlay name, start, end (timeline seconds)
BASE_OVERLAYS = [
    ("hook", 0.4, 6.6), ("cap_riya", 8.1, 10.3),
    ("chip_alpona", 14.6, 20.9), ("chip_writer", 32.3, 37.9),
    ("chip_business", 48.4, 54.9), ("chip_bgremove", 55.3, 60.9), ("chip_team", 61.3, 66.0),
    ("cap_nanu", 75.9, 79.3),
]
NO_CAPTION = (38.0, 48.3)  # Smart Resize / templates graphics already carry the words on screen
TIMELINE = json.load(open(ROOT / "vo2" / "timeline.json"))


def overlays():
    out = list(BASE_OVERLAYS)
    for i, x in enumerate(TIMELINE):
        a, b = x["start"] - 0.05, x["end"] + 0.35
        if i + 1 < len(TIMELINE):
            b = min(b, TIMELINE[i + 1]["start"] - 0.02)
        if NO_CAPTION[0] <= a < NO_CAPTION[1] and b <= NO_CAPTION[1] + 1:
            continue
        if a >= 79.4:  # the end card already shows the offer
            continue
        out.append((f"cap_{x['id']}", a, b))
    return out

VO_DIR = ROOT / "vo2"

SFX = [("whoosh", 6.8, -14), ("chime", 12.8, -20), ("magic", 15.9, -10), ("whoosh", 20.8, -12), ("sparkle", 23.7, -12),
       ("whoosh", 37.8, -12), ("pop", 38.35, -10), ("pop", 39.05, -10), ("pop", 39.75, -10),
       ("whoosh", 41.8, -14), ("bell", 48.2, -16), ("shutter", 57.3, -8), ("crowd", 66.0, -14),
       ("whoosh", 79.2, -12), ("chime", 83.5, -10)]

MUSIC = ROOT / "music_candidates" / "31.mp3"  # Mixkit "Dreaming Big" by Ahjay Stelino (Mixkit Stock Music Free License)
MUSIC_OFFSET = 15.0
TOTAL = 90.0


def starts():
    t, out = 0.0, []
    for s in SEGMENTS:
        out.append(t)
        t += s[3]
    assert abs(t - TOTAL) < 1e-6, t
    return out


def build():
    OUT.mkdir(exist_ok=True)
    T = starts()
    args, fc = [FF, "-y", "-hide_banner"], []
    n = 0

    def inp(*a):
        nonlocal n
        args.extend(a)
        n += 1
        return n - 1

    # ---- video segments
    vlabels = []
    for i, (kind, src, tin, slot, extra, _) in enumerate(SEGMENTS):
        dur = slot + (X if i < len(SEGMENTS) - 1 else 0)
        if kind == "clip":
            k = inp("-i", clip(src))
            f = []
            if extra.startswith("speed:"):
                sp = float(extra.split(":")[1])
                f.append(f"trim=start={tin},setpts=(PTS-STARTPTS)/{sp}")
            else:
                f.append(f"trim=start={tin},setpts=PTS-STARTPTS")
                if extra:
                    f.append(extra)
            f += ["scale=1920:1080:flags=lanczos", GRADE, "fps=24",
                  f"tpad=stop_mode=clone:stop_duration=1", f"trim=duration={dur}", "setpts=PTS-STARTPTS", "format=yuv420p", "fps=24", "settb=1/24"]
        else:
            k = inp("-framerate", "24", "-i", str(ROOT / "gfx" / src / "f%04d.png"))
            f = ["fps=24", "tpad=stop_mode=clone:stop_duration=1", f"trim=duration={dur}", "setpts=PTS-STARTPTS", "format=yuv420p", "fps=24", "settb=1/24"]
        fc.append(f"[{k}:v]{','.join(f)}[v{i}]")
        vlabels.append(f"v{i}")

    cur = vlabels[0]
    for i in range(1, len(vlabels)):
        o = f"x{i}"
        fc.append(f"[{cur}][{vlabels[i]}]xfade=transition=fade:duration={X}:offset={T[i]:.3f}[{o}]")
        cur = o
    # fade from black at start, to nothing at end (end card holds)
    fc.append(f"[{cur}]fade=t=in:st=0:d=0.6[base]")
    cur = "base"

    # ---- overlays
    for j, (name, a, b) in enumerate(overlays()):
        k = inp("-loop", "1", "-framerate", "24", "-t", f"{b - a:.3f}", "-i", str(ROOT / "gfx" / "overlays" / f"{name}.png"))
        d = b - a
        fc.append(f"[{k}:v]format=rgba,fade=t=in:st=0:d=0.25:alpha=1,fade=t=out:st={d - 0.25:.3f}:d=0.25:alpha=1,"
                  f"setpts=PTS-STARTPTS+{a}/TB[o{j}]")
        fc.append(f"[{cur}][o{j}]overlay=0:0:eof_action=pass:format=auto[ov{j}]")
        cur = f"ov{j}"
    fc.append(f"[{cur}]format=yuv420p[vout]")

    # ---- audio: voiceover
    alabels = []
    for x in TIMELINE:
        name = x["id"]
        k = inp("-i", str(VO_DIR / x["wav"]))
        fc.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(x['start'] * 1000)}:all=1,volume=1.0[{name}]")
        alabels.append(name)
    fc.append(f"[{']['.join(alabels)}]amix=inputs={len(alabels)}:normalize=0,apad=whole_dur={TOTAL}[vo_mix]")
    fc.append("[vo_mix]asplit=2[vo_a][vo_sc]")

    # native clip audio
    nat = []
    for i, (kind, src, tin, slot, extra, gain) in enumerate(SEGMENTS):
        if kind != "clip" or gain is None:
            continue
        k = inp("-i", clip(src))
        sp = float(extra.split(":")[1]) if extra.startswith("speed:") else 1.0
        tempo = f",atempo={sp}" if sp != 1.0 else ""
        fc.append(f"[{k}:a]atrim=start={tin},asetpts=PTS-STARTPTS{tempo},atrim=duration={slot + X},"
                  f"afade=t=in:d=0.15,afade=t=out:st={slot - 0.05:.3f}:d={X + 0.05:.3f},volume={gain}dB,"
                  f"aresample=48000,aformat=channel_layouts=stereo,adelay={int(T[i] * 1000)}:all=1[n{i}]")
        nat.append(f"n{i}")
    fc.append(f"[{']['.join(nat)}]amix=inputs={len(nat)}:normalize=0,apad=whole_dur={TOTAL}[nat_mix]")

    # sfx
    sl = []
    for j, (name, at, g) in enumerate(SFX):
        k = inp("-i", str(ROOT / "sfx" / f"{name}.mp3"))
        fc.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g}dB,adelay={int(at * 1000)}:all=1[s{j}]")
        sl.append(f"s{j}")
    fc.append(f"[{']['.join(sl)}]amix=inputs={len(sl)}:normalize=0,apad=whole_dur={TOTAL}[sfx_mix]")

    # music: quiet under the hook, swells at "What if home…", dips for Nanu, resolves on the end card
    k = inp("-ss", str(MUSIC_OFFSET), "-t", str(TOTAL), "-i", str(MUSIC))
    env = ("0.30+0.70*clip((t-10.2)/2.2,0,1)"
           "-0.45*clip((t-75.2)/0.8,0,1)*(1-clip((t-79.4)/0.8,0,1))")
    fc.append(f"[{k}:a]aresample=48000,aformat=channel_layouts=stereo,volume='{env}':eval=frame,volume=-9dB,"
              f"afade=t=in:d=1.5,afade=t=out:st={TOTAL - 3.5}:d=3.5[mus]")
    fc.append("[mus][vo_sc]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=400:makeup=1[mus_d]")

    fc.append("[vo_a][nat_mix][sfx_mix][mus_d]amix=inputs=4:normalize=0,atrim=duration=90,"
              "alimiter=limit=0.89:level=false[amix]")
    return args, fc


def run(args, fc, out, extra_audio_filter):
    fc = fc + [f"[amix]{extra_audio_filter}[aout]"]
    cmd = args + ["-filter_complex", ";".join(fc), "-map", "[vout]", "-map", "[aout]",
                  "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "24",
                  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-t", str(TOTAL), str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-4000:])
        raise SystemExit(1)
    return r.stderr


def main():
    args, fc = build()
    # pass 1: measure loudness on the audio mix only (fast): render to null
    measure = subprocess.run(args + ["-filter_complex", ";".join(fc + ["[vout]nullsink", "[amix]loudnorm=I=-14:TP=-1:LRA=11:print_format=json[aout]"]),
                                     "-map", "[aout]", "-t", str(TOTAL), "-f", "null", "-"], capture_output=True, text=True)
    found = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", measure.stderr, re.S)
    if not found:
        print(measure.stderr[-4000:])
        raise SystemExit(1)
    js = json.loads(found[-1])
    ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
          f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    master = OUT / "vingo_promo_90s_16x9.mp4"
    run(args, fc, master, ln + ",aresample=48000")
    print("wrote", master)

    # 9:16 social version: master centered on a blurred, zoomed copy of itself
    vert = OUT / "vingo_promo_90s_9x16.mp4"
    cmd = [FF, "-y", "-hide_banner", "-i", str(master), "-filter_complex",
           "[0:v]split=2[a][b];[a]scale=-2:1920,crop=1080:1920,boxblur=30:3,eq=brightness=-0.08[bg];"
           "[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,format=yuv420p[v]",
           "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-crf", "20", "-preset", "medium",
           "-c:a", "copy", "-movflags", "+faststart", str(vert)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-3000:])
        raise SystemExit(1)
    print("wrote", vert)


if __name__ == "__main__":
    main()
