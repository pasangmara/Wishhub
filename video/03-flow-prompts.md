# Google Flow (Veo 3) Prompts: Copy & Paste

## Clip review so far (generated in Flow Omni, 10s each, 1280×720)
| Clip | Verdict | Use this part | Notes |
|---|---|---|---|
| C1 busy office | ✅ Keep | **3.0s → 7.5s** | Great golden-hour look, and it ends on Rachel at her desk covered in sticky notes. The first ~2.8s has a purple/magenta light streak across the top-left glass, so skip it. |
| C2 realization | ✅ Keep (hero) | **3.6s → 9.1s** | Strong acting. Omni added a small green "✓" notification pop-up at **2.4–3.5s** (bottom-right), so start after it. Our calendar and email cards cover this corner anyway. |
| C3 butterfly | ✅ Excellent | **3.5s → 10.0s** | The butterfly glows on the screen, flies out, circles, bursts into particles and ends on warm bokeh, a perfect bed for the logo reveal. |
| C6 Rachel relaxed | ✅ Keep | **2.0s → 10.0s** | Matches the Rachel reference. She smiles, types, and sips coffee at the end. ⚠️ **An Apple logo is visible on the laptop lid**, so blur/mask it in the edit (the camera is locked off, so a static blur works). |
| C7 Mike | ✅ Keep (hero) | **4.0s → 10.0s** | The phone lights up, he picks it up, a genuine smile, a coworker pats his shoulder, he laughs. 2–4s is a tight insert on the hands and phone (optional cutaway). |
| C4 floating cards | ⚠️ Partial | **1.8s → 4.0s** + blurred still as a background plate | Flow used our Happy Holidays card but **invented** the Thanksgiving and Work Anniversary designs, and garbled the small text. The showcase is animated from the real card PNGs instead (`assets/motion/showcase.html`). |
| C8 Laura | ✅ Keep | **4.5s → 10.0s** | Hand on heart. The lid shows a generic dot, not a brand logo. An email notification with card 05 is overlaid. |
| C9 celebration | ✅ Excellent | **0.0s → 5.5s** | Rachel and Mike both match their references. (7.5–10s: Mike blowing out the candle is a nice alternate.) |
| C10 Rachel window | ✅ Excellent | **3.0s → 10.0s** | Fades to white by itself, a perfect handoff to the end card. |

**Lessons applied to the prompts below:**
- Rachel's look is now locked to the C2 version: **wavy dark brown hair just past the shoulders, gold hoop earrings**. Upload the still `rachel-reference.png` (C2 at 1.2s) as the reference/ingredient for C6, C9 and C10.
- Every prompt now also says **"no floating UI or notification pop-ups"**.
- Omni clips run 10s. The timeline only needs 5–7s from each, so let the camera move settle and trim in the edit.
- Mike's look is now locked to the C7 version: **gray crewneck sweater over a collared shirt**. Upload `mike-reference.png` (C7 at 8.5s) for C9.
- Laptops and phones must be **unbranded** (C6 came back with an Apple logo), so C8–C10 now say so.
- The US card set is ready in `assets/cards/` (12 cards, 1080×1350), plus `assets/cards-grid-16x9.png` (4K grid of all 12).
- Clips come out at 720p. Download at 1080p (upscale) if Flow offers it; if not, upscale in the editor.

## How to use these in Flow
1. Create a new Flow project called **"Wish Hub – USA"**. Set the aspect ratio to **16:9** (make a second project at **9:16** for social).
2. Use **Text to Video** for each clip below. Each clip is **8–10 seconds** (Omni makes 10s). Generate 2–4 takes and keep the best one.
3. For the card showcase (C4, C5), use **Frames to Video / Ingredients** and upload your real card images
   so Veo animates *your* designs, not invented ones.
4. **Keep characters consistent:** always paste the exact character descriptions (they're already in the prompts).
   When you get a good Rachel/Mike/Laura shot, save a still and reuse it as a start frame or ingredient for later clips.
5. **Text:** AI video renders on-screen text badly. Every prompt says "no text". Add all titles, UI and card text in your editor.
6. **Audio:** Veo 3 generates ambient sound and SFX with each clip. Keep it; it's great for realism. Prompts say "no dialogue, no music"
   because the narrator and music track are added separately so they stay consistent.
7. Use Flow's **Quality** mode for final hero shots (C2, C7, C9) and **Fast** mode for testing.
8. **Start with C1 and C2 as test clips.** If the look is right, produce the rest.

A style suffix is baked into every prompt:
> *Cinematic commercial, shot on ARRI Alexa, 35mm lens, shallow depth of field, soft natural light, warm color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.*

---

## C1 · Hook: busy office (0:00–0:05)
```
Wide dolly shot moving slowly through a modern open-plan American tech office with glass walls, green plants and warm late-afternoon sunlight. People are working fast: typing, on phone calls, walking with coffee. The camera settles on RACHEL, a woman in her late 30s with wavy dark brown hair just past the shoulders, a navy blazer over a white blouse and small gold hoop earrings, sitting at her desk surrounded by sticky notes, juggling a phone call while typing. She looks overwhelmed but focused.
Audio: busy office ambience, keyboard clatter, distant phone rings, muffled chatter.
Cinematic commercial, shot on ARRI Alexa, 35mm lens, shallow depth of field, soft natural light, warm color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```

## C2 · Hook: the realization (0:05–0:10) ⭐ hero shot
```
Slow push-in close-up on RACHEL, a woman in her late 30s with wavy dark brown hair just past the shoulders, navy blazer over a white blouse, small gold hoop earrings, sitting at her office desk. The glow of her computer monitor lights her face. She stops typing, her eyes widen slightly as she reads something on the screen, then her expression sinks into quiet regret. She slowly leans back and exhales. The background office blurs and the room feels suddenly still.
Audio: office noise fades away to near silence, a single soft notification ding, a slow ticking clock.
Cinematic commercial, 50mm lens, very shallow depth of field, moody soft light from the monitor, warm color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```
*Editor overlay on this clip: calendar tile "Mike: 5-Year Work Anniversary · Yesterday" + Laura's email preview.*

## C3 · Turn: the butterfly (0:10–0:16)
```
Close-up of a sleek laptop screen in a softly lit office. A glowing translucent butterfly made of magenta-pink and royal-blue light flutters out of the screen, circles gracefully in slow motion, then bursts into a soft shower of sparkling light particles that fill the frame with a warm white glow.
Audio: gentle magical whoosh, soft shimmering chime.
Cinematic, macro lens, shallow depth of field, dreamy light bloom, magenta and blue color palette, photorealistic with subtle magical realism, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```
*End on white glow, then cut to the logo animation in your editor.*

## C4 · Showcase: floating cards (0:16–0:23)
Use **Ingredients to Video** and upload **3 cards** from `assets/cards/` as ingredients. Make 2 takes with different trios so the showcase shows 6 cards:
- Take A: `01-work-anniversary-mike`, `06-thanksgiving`, `07-happy-holidays`
- Take B: `02-birthday`, `10-diwali`, `05-client-thank-you-10-years`
```
A bright, minimal white studio space with soft pastel gradients of pink and blue. Elegant digital greeting cards float in mid-air, gently rotating and gliding past the camera in a graceful choreographed sequence, each card flipping to face the camera one after another. Soft reflections on a glossy floor below. Camera slowly orbits the floating cards.
Audio: soft airy whooshes as each card passes, light paper flick sounds, subtle sparkle.
Premium product commercial style, 35mm lens, crisp focus, soft diffused studio lighting, clean and airy, 24fps. No extra text, no subtitles, no dialogue, no music.
```

## C5 · Showcase: the grid reveal (0:23–0:30)
```
Top-down camera rising slowly upward to reveal dozens of colorful digital greeting cards neatly arranged in a perfect grid on a clean white surface, like a beautiful gallery. Cards feature birthday balloons, autumn leaves for Thanksgiving, winter holiday lights, fireworks, Diwali lamps, a crescent moon, red lanterns, and elegant corporate designs. A gentle wave of light sweeps across the grid.
Audio: soft rising shimmer, subtle sparkle at the end.
Premium product commercial style, overhead crane shot, bright soft studio light, vibrant but tasteful colors, photorealistic, 24fps. No readable text, no subtitles, no dialogue, no music.
```
*Best result: skip Flow for this shot. Put `assets/cards-grid-16x9.png` in the editor and animate a slow zoom-out (e.g. 140% → 100% over 7s) with a light sweep. It's sharp, the text is 100% correct, and it costs no credits. If you still want motion from Flow, use **Frames to Video** with the grid image as the first frame and the prompt above.*

## C6 · How it works: Rachel relaxed (0:30–0:42, intercut with screen recording)
```
Medium shot of RACHEL, a woman in her late 30s with wavy dark brown hair just past the shoulders, navy blazer over a white blouse, small gold hoop earrings, now relaxed and smiling at her office desk in warm afternoon sunlight. She casually scrolls and clicks on her laptop trackpad, then confidently taps one final click and leans back with a satisfied smile, sipping her coffee.
Audio: calm office ambience, soft trackpad clicks, a gentle coffee cup clink.
Cinematic commercial, 35mm lens, shallow depth of field, soft golden natural light, warm color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```

## C7 · Your brand: Mike's smile (0:48–0:54) ⭐ hero shot
```
Medium close-up of MIKE, a man in his early 30s with short curly black hair, a trimmed beard and a gray crewneck sweater over a collared shirt, sitting at a desk in a bright modern office. His smartphone on the desk lights up and buzzes. He picks it up, reads, and his face breaks into a genuine, surprised, touched smile. A coworker walks by and gives him a friendly pat on the shoulder, and he laughs.
Audio: phone vibration buzz, soft office ambience, a warm short laugh.
Cinematic commercial, 50mm lens, shallow depth of field, bright soft natural window light, warm color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```

## C8 · Automation: Laura, the client (1:00–1:06)
```
Medium shot of LAURA, a woman in her 50s with a silver bob haircut, a cream turtleneck and reading glasses, sitting in an elegant home office with bookshelves and morning light. She opens an unbranded silver laptop with no logo, reads an email, and her face softens into a heartfelt smile. She gently places her hand over her heart and nods.
Audio: soft morning ambience, birds faintly outside, a gentle email notification chime.
Cinematic commercial, 35mm lens, shallow depth of field, soft warm morning light, warm color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```

## C9 · Close: the celebration (1:16–1:22) ⭐ hero shot
```
Warm medium-wide shot in a modern American office. A small diverse team gathers around MIKE, a man in his early 30s with short curly black hair, trimmed beard, gray crewneck sweater over a collared shirt, who is holding a small cake with a single lit candle. RACHEL, a woman in her late 30s with wavy dark brown hair just past the shoulders, navy blazer over a white blouse, small gold hoop earrings, stands beside him smiling proudly. Everyone claps and laughs. A large wall monitor behind them glows with soft colorful abstract light. Confetti drifts slowly in the golden light.
Audio: warm laughter, light applause, cheerful office ambience.
Cinematic commercial, 35mm lens, shallow depth of field, golden-hour window light, warm joyful color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```
Upload **both** `rachel-reference.png` and `mike-reference.png` as ingredients.
*In the editor, put `assets/cards/01-work-anniversary-mike.png` on the wall monitor (screen replacement / corner-pin tracking).*

## C10 · Close: final hero push-in (1:22–1:28)
```
Slow cinematic push-in on RACHEL, a woman in her late 30s with wavy dark brown hair just past the shoulders, navy blazer over a white blouse, small gold hoop earrings, standing by a large office window at golden hour, looking at her unbranded phone with a calm, content smile. Soft lens flare. The frame gradually brightens and fades into soft white light.
Audio: gentle ambient room tone, faint distant laughter.
Cinematic commercial, 50mm lens, shallow depth of field, golden-hour backlight, warm dreamy color grade with subtle magenta and blue accents, photorealistic, 24fps. No on-screen text, no subtitles, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```
*The fade to white hands off to the logo lockup.*

---

## Optional background plate for the Offer scene (1:06–1:16)
```
Abstract slow-moving background of soft flowing gradients in magenta-pink, royal blue and warm orange, with tiny glowing butterfly-shaped light particles drifting upward. Calm, elegant, premium, seamless loop feel.
Audio: soft airy ambient shimmer.
Motion design style, smooth, clean, 24fps. No text, no logos, no floating UI or notification pop-ups, no dialogue, no music.
```

## 9:16 (vertical) versions
Re-generate **C2, C3, C7 and C9** in a 9:16 Flow project, and change "Wide dolly shot" / "medium-wide" to **"vertical framing, subject centered"**.
Everything else can be cropped from 16:9 in the editor.

## Troubleshooting
- **Character looks different between clips:** reuse a saved still of that character as the start frame (Frames to Video) or as an ingredient.
- **Unwanted text or gibberish on screens:** add "screens show only soft abstract light" to the prompt.
- **Veo adds music or speech:** re-generate or mute the clip; your separate music and VO tracks will cover it.
- **Too dark or moody for B2B:** swap "moody" for "bright, clean" in the lighting line.
