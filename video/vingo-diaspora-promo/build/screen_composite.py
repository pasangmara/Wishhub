"""Replace the blank white laptop screens in two Flow clips with real Vingo screens.

Tracks the glowing screen per frame (screen_track.detect), fills gaps by interpolation,
smooths the corners over time, and perspective-warps the content onto it.
Writes ../renders/clips_screen/<clip>.mp4 (720p, original audio).
"""
import subprocess
from pathlib import Path

import cv2
import numpy as np

from screen_track import detect

FF = "/root/bin/ffmpeg"
ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent / "renders" / "clips"
DST = ROOT.parent / "renders" / "clips_screen"
FPS = 24

JOBS = {
    # clip: (process window seconds, min area, min centroid y as fraction, content schedule [(t, image)], crossfade s)
    "Daughter_and_mother_making_card": ((5.8, 8.4), 30000, 0.5, [(0.0, "screen_hero.png")], 0.3),
    "Daughter_clicks_glowing_screen": ((0.0, 10.0), 8000, 0.3,
                                       [(0.0, "screen_editor_before.png"), (3.0, "screen_editor_after.png")], 0.45),
}


def read_frames(path):
    cap = cv2.VideoCapture(str(path))
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    return frames


def track(frames, window, min_area, min_cy):
    H = frames[0].shape[0]
    quads = [None] * len(frames)
    for i, f in enumerate(frames):
        t = i / FPS
        if not (window[0] <= t <= window[1]):
            continue
        q, a = detect(f)
        if q is None or a < min_area or q[:, 1].mean() < min_cy * H:
            continue
        quads[i] = q
    # shot cuts: big jumps in the quad centre split the track into shots
    idx = [i for i, q in enumerate(quads) if q is not None]
    shots, cur = [], []
    for i in idx:
        if cur and (i - cur[-1] > 12 or np.linalg.norm(quads[i].mean(0) - quads[cur[-1]].mean(0)) > 120):
            shots.append(cur)
            cur = []
        cur.append(i)
    if cur:
        shots.append(cur)
    out = [None] * len(frames)
    for s in shots:
        if len(s) < 6:
            continue
        a, b = s[0], s[-1]
        arr = np.array([quads[i] for i in s])  # (n,4,2)
        full = np.empty((b - a + 1, 4, 2), np.float32)
        for c in range(4):
            for d in range(2):
                full[:, c, d] = np.interp(np.arange(a, b + 1), s, arr[:, c, d])
        # temporal smoothing (centred moving average, 5 frames)
        k = 5
        pad = np.concatenate([np.repeat(full[:1], k // 2, 0), full, np.repeat(full[-1:], k // 2, 0)])
        sm = np.array([pad[j:j + k].mean(0) for j in range(len(full))])
        for j, i in enumerate(range(a, b + 1)):
            out[i] = sm[j]
    return out


def content_at(t, schedule, xfade, imgs):
    cur = schedule[0]
    for s in schedule:
        if t >= s[0]:
            cur = s
    i = schedule.index(cur)
    img = imgs[cur[1]]
    if i > 0 and t < cur[0] + xfade:
        a = (t - cur[0]) / xfade
        img = cv2.addWeighted(imgs[schedule[i - 1][1]], 1 - a, img, a, 0)
    return img


def composite(frame, quad, content, alpha):
    h, w = frame.shape[:2]
    ch, cw = content.shape[:2]
    c = quad.mean(0)
    quad = c + (quad - c) * 1.025  # cover the glowing bezel edge
    src = np.float32([[0, 0], [cw, 0], [cw, ch], [0, ch]])
    M = cv2.getPerspectiveTransform(src, quad.astype(np.float32))
    warped = cv2.warpPerspective(content, M, (w, h), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT)
    mask = np.zeros((h, w), np.float32)
    cv2.fillConvexPoly(mask, np.round(quad).astype(np.int32), 1.0, lineType=cv2.LINE_AA)
    mask = cv2.GaussianBlur(mask, (3, 3), 0) * alpha
    # screens are emissive: lift the content a touch and let 8% of the original glow through
    lit = np.clip(warped.astype(np.float32) * 1.06 + 6, 0, 255)
    m = mask[..., None]
    out = frame.astype(np.float32) * (1 - m * 0.92) + lit * (m * 0.92)
    return out.astype(np.uint8)


def main():
    DST.mkdir(parents=True, exist_ok=True)
    for name, (window, min_area, min_cy, schedule, xfade) in JOBS.items():
        src = SRC / f"{name}.mp4"
        frames = read_frames(src)
        quads = track(frames, window, min_area, min_cy)
        imgs = {p: cv2.imread(str(ROOT / "assets" / p)) for _, p in schedule}
        first = next((i for i, q in enumerate(quads) if q is not None), None)
        tmp = DST / f"{name}_v.mp4"
        h, w = frames[0].shape[:2]
        p = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(FPS),
                              "-i", "-", "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", str(tmp)],
                             stdin=subprocess.PIPE)
        n_done = 0
        for i, f in enumerate(frames):
            q = quads[i]
            if q is not None:
                # "screen turns on" fade for the first 0.25s of tracking
                alpha = min(1.0, (i - first) / (0.25 * FPS) + 0.15) if first is not None else 1.0
                f = composite(f, q, content_at(i / FPS, schedule, xfade, imgs), alpha)
                n_done += 1
            p.stdin.write(f.tobytes())
        p.stdin.close()
        p.wait()
        subprocess.run([FF, "-v", "error", "-y", "-i", str(tmp), "-i", str(src), "-map", "0:v", "-map", "1:a", "-c", "copy",
                        str(DST / f"{name}.mp4")], check=True)
        tmp.unlink()
        print(f"{name}: screen replaced on {n_done}/{len(frames)} frames")


if __name__ == "__main__":
    main()
