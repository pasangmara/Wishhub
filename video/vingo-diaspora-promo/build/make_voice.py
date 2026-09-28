"""Generate the story narration through the n8n MiniMax webhook and lay it on the timeline.
Writes vo2/<id>.mp3 and vo2/timeline.json ([{id, start, end, cap}])."""
import json, os, re, subprocess, sys
import requests

ROOT = os.path.dirname(os.path.abspath(__file__))
story = json.load(open(os.path.join(ROOT, "story.json")))
key = open(sys.argv[1]).read().strip()
s = requests.Session(); s.verify = "/root/.ccr/ca-bundle.crt"
GAP = 0.25

def dur(p):
    e = subprocess.run(["/root/bin/ffmpeg", "-hide_banner", "-i", p], capture_output=True, text=True).stderr
    h, m, sec = re.search(r"Duration: (\d+):(\d+):([\d.]+)", e).groups()
    return int(h) * 3600 + int(m) * 60 + float(sec)

os.makedirs(os.path.join(ROOT, "vo2"), exist_ok=True)
t, out = 0.0, []
for ln in story["lines"]:
    import hashlib
    h = hashlib.sha1(json.dumps([ln["say"], ln["emotion"], ln.get("speed", 1.0), story["voice"]]).encode()).hexdigest()[:8]
    p = os.path.join(ROOT, "vo2", f"{ln['id']}_{h}.mp3")
    if not os.path.exists(p):
        r = s.post("https://vingobd.app.n8n.cloud/webhook/vingo-tts-natural", headers={"x-vingo-key": key},
                   json={"text": ln["say"], "voice": story["voice"], "emotion": ln["emotion"], "speed": ln.get("speed", 1.0)}, timeout=180)
        assert r.status_code == 200 and r.headers.get("content-type", "").startswith("audio"), (ln["id"], r.status_code, r.text[:200])
        open(p, "wb").write(r.content)
    # trim leading/trailing silence so lines butt together naturally
    tp = p.replace(".mp3", "_trim.wav")
    subprocess.run(["/root/bin/ffmpeg", "-v", "error", "-y", "-i", p, "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
                    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse", tp], check=True)
    d = dur(tp)
    start = max(t + GAP, ln.get("at", 0))
    for a, b, _ in story["reserved"]:
        if start < b and start + d > a:
            print(f"!! {ln['id']} {start:.2f}-{start + d:.2f} overlaps reserved {a}-{b}")
    out.append({"id": ln["id"], "start": round(start, 3), "end": round(start + d, 3), "cap": ln["cap"], "wav": os.path.basename(tp)})
    t = start + d
    print(f"{ln['id']} {start:6.2f} → {start + d:6.2f} ({d:4.2f}s)  {ln['cap']}")
# report lines that start late versus their scene anchor
for ln, o in zip(story["lines"], out):
    if "at" in ln and o["start"] - ln["at"] > 0.3:
        print(f"!! {ln['id']} starts {o['start'] - ln['at']:.2f}s after its scene")
json.dump(out, open(os.path.join(ROOT, "vo2", "timeline.json"), "w"), indent=1, ensure_ascii=False)
print("ends at", round(t, 2))
