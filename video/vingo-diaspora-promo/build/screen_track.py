"""Find the glowing white laptop screen in each frame and return its 4 corners (TL,TR,BR,BL)."""
import cv2, numpy as np

def order(pts):
    pts = np.array(pts, np.float32).reshape(-1, 2)
    s = pts.sum(1); d = np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], np.float32)

def detect(img, min_area=2500):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 2] > 228) & (hsv[..., 1] < 40)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best = None
    for c in cs:
        a = cv2.contourArea(c)
        if a < min_area:
            continue
        x, y, w, h = cv2.boundingRect(c)
        ar = w / h
        if not (1.1 < ar < 2.2):
            continue
        hull = cv2.convexHull(c)
        fill = a / max(cv2.contourArea(hull), 1)
        if fill < 0.80:
            continue
        score = a * fill
        if best is None or score > best[0]:
            best = (score, hull, a)
    if best is None:
        return None, 0
    hull = best[1]
    peri = cv2.arcLength(hull, True)
    for eps in (0.02, 0.03, 0.04, 0.05, 0.07):
        ap = cv2.approxPolyDP(hull, eps * peri, True)
        if len(ap) == 4:
            return order(ap), best[2]
    return order(cv2.boxPoints(cv2.minAreaRect(hull))), best[2]
