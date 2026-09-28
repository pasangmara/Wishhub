# Motion-graphic segments (draft v1)

Each `*.html` page exposes `window.render(t)` and is rendered frame by frame (24fps, 1920×1080) by `render.js`
(playwright-core + headless Chromium, frames piped into ffmpeg).

| File | Length | Scene |
|---|---|---|
| `showcase.html` | 10.8s | Real US cards glide in over a blurred C4 plate, then zoom out to the card grid |
| `how.html` | 9.0s | App mockup: Discover → Personalize → Schedule → Send |
| `brand.html` | 6.0s | Card 01 builds up: logo → "5 Years" → name → message |
| `dash.html` | 6.5s | Dashboard: upcoming wishes, stats, channel chips |
| `offer.html` | 10.0s | Free trial / free demo offer with cursor click |
| `end.html` | 6.0s | Logo, tagline, URL, "Book your free demo" |

To render, put these files in one folder together with the card PNGs (`../cards/*.png`), `../wishhub-logo.png`,
`../cards-grid-16x9.png` (renamed to `grid.png`), a blurred C4 still named `showcase_bg.jpg`, and a `fonts/` folder
(Poppins, Great Vibes, Playfair Display, Cinzel Decorative from Google Fonts). Then run:

```
npm i playwright-core
FFMPEG=/path/to/ffmpeg node render.js how.html 9 seg_how.mp4
```

These are **mockups** of the product flow. Swap in a real screen recording of the Wish Hub dashboard when it's ready.
