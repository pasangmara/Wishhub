# Google Flow: image first, then video (90s master)

This is the **primary workflow**. For each shot, first make a still frame, get it right, then animate it.
`flow-prompts.md` is the text-to-video fallback.

---

## Step 0: how to work in Flow

1. **Make the image.** Use Flow's image generator (Imagen / Nano Banana), 16:9. Attach the reference sheets listed under 📎 so the faces and rooms stay the same.
2. **Send the frame to me.** I check it against the checklist at the bottom and give you a fixed prompt if needed.
3. **Animate it.** Use **Frames to Video**, put the approved image as the *start frame* (plus an *end frame* where given), and paste the 🎬 video prompt. The video prompt only describes **motion, camera and sound**. Don't re-describe the look, because that fights the frame.
4. **Generate 2–4 takes** at 8s each and send me the best one or two.

**File names** (so we don't get lost): `S01_frame_v1.png`, `S01_clip_v1.mp4`, `REF_ammu_v1.png` and so on.
**Upload** them here in the chat, or put them in the repo under `video/vingo-diaspora-promo/renders/`.

### Style line: add to the end of EVERY image prompt
> Cinematic still from a premium commercial, shot on ARRI Alexa, 35mm anamorphic lens, warm golden grade with deep crimson and marigold accents, soft natural skin tones, gentle film grain, shallow depth of field, photorealistic. No text, no letters, no logos, no watermark.

### Negative prompt (where Flow allows)
> text, letters, subtitles, logos, watermark, UI on screens, extra fingers, distorted hands, warped face, cartoon, plastic skin, oversaturated, Hindi or Devanagari signage, Indian flag, bindi on Muslim characters

---

## Step 1: reference sheets (make these FIRST and send them to me)

Every later image uses these, so spend your time here. Approve each one before moving on.

### REF_ammu (mother)
🖼 **Image prompt**
> Character reference sheet, three views side by side (front, three-quarter, profile) of the same Bangladeshi Muslim woman, about 48 years old. Warm medium-brown skin, kind tired eyes, a soft round face, black hair with a few grey strands in a loose low bun. She wears a deep bottle-green cotton sari with a thin red border, draped in the Bangladeshi style with the anchal over her left shoulder, a plain cream cardigan on top, a small gold nose stud and thin gold bangles. Neutral light-grey studio background, soft even lighting, full upper body visible.

🎯 Mood reference: an ordinary Queens auntie, not a model. Real, warm, slightly tired.

### REF_riya (daughter)
🖼 **Image prompt**
> Character reference sheet, three views side by side (front, three-quarter, profile) of the same young Bangladeshi-American woman, about 21 years old. Warm brown skin, long dark wavy hair past the shoulders, expressive eyes, a natural confident smile. Wears an oversized cream hoodie, small gold hoop earrings, a thin gold chain. Neutral light-grey studio background, soft even lighting, upper body visible.

### REF_abbu (father)
🖼 **Image prompt**
> Character reference sheet, three views side by side (front, three-quarter, profile) of the same Bangladeshi man, about 52 years old. Medium-brown skin, neatly trimmed salt-and-pepper beard, thin rectangular glasses, short hair. Wears a light-blue button-up shirt with the sleeves rolled to the elbow, and a wristwatch. Friendly, hard-working shopkeeper look. Neutral light-grey studio background, soft even lighting, upper body visible.

### REF_nanu (grandmother in Dhaka)
🖼 **Image prompt**
> Character reference sheet, three views side by side (front, three-quarter, profile) of the same elderly Bangladeshi woman, about 75 years old. Deep-set gentle eyes, a wrinkled warm face, white hair covered loosely with the end of a white cotton sari that has a pale sky-blue border, round reading glasses. Neutral light-grey studio background, soft even lighting, upper body visible.

### REF_home (Queens living room)
🖼 **Image prompt**
> Wide establishing interior of a cozy, modest apartment living room in Queens, New York, at night in winter. A brown fabric sofa with red and mustard cushion covers in Bangladeshi block-print patterns, a framed Nakshi Kantha embroidery on the wall, a warm tungsten floor lamp at the left of the sofa, a small wooden coffee table with a steel tea cup. Large window at the right, snow falling outside and a soft blue city glow. No people.

### REF_shop (Jackson Heights grocery)
🖼 **Image prompt**
> Interior of a small Bangladeshi grocery store in Jackson Heights, Queens, in daytime. Crowded wooden shelves of spices, lentils and rice sacks, mango crates on the floor, a small counter with a card reader at the front right. A glass shop window and door showing a busy New York street with yellow cabs outside. Warm practical lighting mixed with daylight. No people, no readable signs.

### REF_style (hero look)
Once shot 1's frame is approved, it becomes `REF_style`. Attach it to every later image as the **style** reference so the grade matches.

---

## Step 2: shots (11 shots, 90s)

| # | Time | Beat |
|---|---|---|
| 1 | 0:00 | Hook: Ammu alone, homesick |
| 2 | 0:08 | Riya: "Let's make the Eid card" |
| 3 | 0:16 | Magic Alpona reveal |
| 4 | 0:24 | Heritage art macro |
| 5 | 0:32 | Bangla AI Writer |
| 6 | 0:40 | Smart Resize flat-lay |
| 7 | 0:48 | Template montage, 10,000+ |
| 8 | 0:56 | Abbu's shop poster |
| 8b | 1:04 | Background Remover |
| 9 | 1:12 | Community mela |
| 10 | 1:20 | Nanu's payoff, then the end card, held to 1:30 |

---

### S01: Hook: "a world away" (0:00–0:08)
📎 Attach: REF_ammu, REF_home
🎯 Mood reference: the quiet opening of *The Farewell* (2019), and the melancholy window-light of Edward Hopper's *Automat*: one person, warm light, cold city outside.

🖼 **Start frame**
> Medium close-up at night: the Bangladeshi mother from the reference sits alone on the sofa in the Queens living room, holding a phone at chest height and looking down at it with a small nostalgic smile and glistening eyes. The phone lights her face softly from below; the warm floor lamp is behind her left shoulder. Through the window at the right, snow falls against a blurred blue city glow. Framed with the subject at the center.

🎬 **Video prompt**
> Very slow push-in toward her face. She scrolls once with her thumb, pauses, and her smile fades into quiet longing; she exhales softly. Snowflakes drift past the window. Audio: a gentle snowfall hush, distant New York traffic, a faint radiator hum. No dialogue, no music.

---

### S02: The turn (0:08–0:16)
📎 Attach: REF_ammu, REF_riya, REF_home, REF_style
🎯 Mood reference: Apple's "The Surprise" (Chinese New Year 2018) for the playful, warm family energy.

🖼 **Start frame**
> Medium two-shot on the same sofa: the daughter from the reference drops down beside her mother, holding a closed silver laptop, shoulder to shoulder, grinning at her. The mother turns toward her, surprised, with the phone still in her hand. The warm lamp is behind, the snowy window at the right. Both faces clearly visible, centered.

🎬 **Video prompt**
> The daughter bumps her mother's shoulder playfully and says with a natural American accent: "Ammu, let's make the Eid card this year." The mother breaks into a smile. The daughter opens the laptop; its blank screen glows white and lights both faces. Slow dolly in. Audio: the sofa creaks, the laptop lid clicks open, the daughter's line. No music.

---

### S03: WOW, Magic Alpona (0:16–0:24)
📎 Attach: REF_ammu, REF_riya, REF_home, REF_style
🎯 Mood reference: the "reveal" moments in Google Pixel "Magic Editor" ads, where people react to the screen and we mostly see faces.

🖼 **Start frame**
> Over-the-shoulder shot from behind both women, looking toward an open laptop on the coffee table. The laptop screen is a flat, evenly glowing blank white rectangle, perfectly front-facing (for screen replacement). The daughter's finger is on the trackpad. Warm lamp light, snowy window softly out of focus.

🖼 **End frame** (use as the end frame in Frames to Video)
> The same framing, a moment later: warm golden light spills from the laptop across both women's faces as they lean back in delight; the mother covers her mouth with one hand, amazed. The screen is still a blank glowing rectangle.

🎬 **Video prompt**
> The daughter clicks once. Golden light blooms from the screen and washes over them; both women lean back delighted. Slow push-in toward the screen. Audio: a single trackpad click, then a soft magical shimmer. No dialogue.

✂️ **Edit:** replace the screen with the real Magic Alpona screen recording from vingobd.com.

---

### S04: Heritage art macro (0:24–0:32)
📎 Attach: REF_style only
🎯 Mood reference: luxury-fabric macro films (Hermès silk, Sabyasachi campaign close-ups) and real Nakshi Kantha. Search "Nakshi Kantha lotus motif" and attach one real photo as an extra reference if Flow drifts toward Indian embroidery.

🖼 **Start frame**
> Extreme macro of deep crimson handloom cotton. A half-finished Nakshi Kantha lotus motif in golden running-stitch embroidery, with the needle and thread visible mid-stitch. Beside it, fine white rice-paste alpona lines in a symmetrical Bengali floral pattern on terracotta. Glowing warm rim light, very shallow depth of field.

🎬 **Video prompt**
> The golden thread stitches itself forward and completes the lotus; the white alpona lines draw themselves outward in perfect symmetry. The camera glides slowly sideways across the surface, revealing a fine Jamdani weave and then bold rickshaw-art flowers in pink, yellow and teal. Audio: the whisper of thread through cloth, soft wind chimes.

---

### S05: Bangla AI Writer (0:32–0:40)
📎 Attach: REF_ammu, REF_riya, REF_home, REF_style
🎯 Mood reference: a second-generation kid helping a parent. Pure emotion, no tech-demo feel.

🖼 **Start frame**
> Close-up of the daughter's hands typing on the silver laptop keyboard, the mother leaning in just behind her, softly out of focus, with her glasses on, reading the screen (screen out of frame). Warm lamp light.

🎬 **Video prompt**
> The typing slows and stops. Rack focus from the hands to the mother's face: she reads silently, her lips moving slightly, then smiles proudly and rests her hand on her daughter's shoulder. Audio: soft keyboard typing, a gentle laugh. No dialogue.

✂️ **Edit:** cut in 2 seconds of the real Bangla AI Writer screen recording.

---

### S06: Smart Resize (0:40–0:48)
📎 Attach: REF_style
🎯 Mood reference: Wes Anderson-style top-down symmetry, like an Apple product flat-lay.

🖼 **Start frame**
> Perfectly symmetrical top-down flat-lay on warm terracotta paper: a smartphone, a tablet, a laptop and a printed blank greeting card arranged in a neat grid, scattered marigold petals and a small brass diya between them. All screens blank white and glowing, front-facing. Soft daylight.

🖼 **End frame**
> The same flat-lay, 10% closer, with more marigold petals scattered around. The screens are the same blank white.

🎬 **Video prompt**
> Slow overhead crane down toward the grid. A few marigold petals drift down and settle. Audio: soft room tone.

✂️ **Edit:** put the real Smart Resize outputs (WhatsApp status, Instagram story, Facebook post, print invite) on each device, with a "pop" for each on the beat.

---

### S07: Template montage (0:48–0:56)
Make 4 separate **2s** frames and animate each (Frames to Video, then trim to 2s). Attach REF_style to all of them.
🎯 Mood reference: the Coca-Cola Ramadan and Eid ads, and Google's "Year in Search" montage energy.

| Sub-shot | 🖼 Start frame |
|---|---|
| 7a | Close-up of a bride's hennaed hands holding a red and gold wedding invitation card (blank face), bangles, soft bokeh. |
| 7b | A Pohela Boishakh morning in a New York park: young women in white saris with red borders and marigold flower crowns, laughing. |
| 7c | Eid morning outside a Queens mosque: children in new panjabis hugging a grandfather in a white tupi cap. |
| 7d | A Victory Day parade on a New York street: kids waving small Bangladesh flags (green field, red disc offset slightly toward the pole). |

🎬 **Video prompt (each)**
> Energetic handheld movement, joyful action continues naturally for 2 seconds. Audio: crowd joy and dhak drum hits.

✂️ **Edit:** overlay real template thumbnails and a "10,000+" counter.

---

### S08: Abbu's shop (0:56–1:04)
📎 Attach: REF_abbu, REF_shop, REF_style
🎯 Mood reference: small-business ads like Google's "Grow with Google" local-shop stories.

🖼 **Start frame**
> Medium shot inside the grocery: the father from the reference stands behind the counter, tapping on his phone, focused, glasses slightly down his nose. Mango crates and spice shelves behind him; the glass shop window and the busy street at the left.

🎬 **Video prompt**
> He taps, nods satisfied, walks around the counter and tapes a freshly printed colorful poster (blank side toward the camera) onto the inside of the shop window, then steps back and smiles as a customer opens the door. Audio: the shop door bell, street ambience, tape tearing.

---

### S08b: Background Remover (1:04–1:12), new
📎 Attach: REF_abbu, REF_shop, REF_style

🖼 **Start frame**
> Over-the-shoulder close-up: the father holds his phone up and photographs a wooden crate of ripe golden mangoes sitting on the shop counter. The phone screen is blank and glowing (for replacement). Warm shop light.

🎬 **Video prompt**
> He taps the phone screen once, lowers it and looks at it with a pleased raised eyebrow. Slight handheld camera. Audio: a camera shutter click, then a soft "swoosh".

✂️ **Edit:** screen-record the Background Remover on a real mango photo, and composite it onto the phone.

---

### S09: Community mela (1:12–1:20)
Two 4-second beats.
🎯 Mood reference: real Boishakhi Mela footage from Jackson Heights and Astoria (search YouTube for "Boishakhi Mela New York") for the costumes and color.

**9a** 📎 Attach: REF_riya, REF_style
🖼 **Start frame**
> Evening in a community center hall: five Bangladeshi-Americans of different ages (an elder in a white tupi cap, two aunties in cotton saris, two young volunteers including the daughter from the reference) gathered around a table of laptops and phones, pointing and laughing. Folding chairs, paper garlands.

🎬 **Video prompt**
> They lean in together, someone points at a screen and everyone laughs. Audio: overlapping chatter and laughter.

**9b** 📎 Attach: REF_style
🖼 **Start frame**
> Wide daytime shot of an outdoor Boishakhi Mela in a New York City park: a crowd in red and white saris and panjabis, colorful paper masks, an ektara player, kids with face paint, food stalls with marigold garlands. No readable signs.

🎬 **Video prompt**
> Slow crane up over the crowd, revealing the whole festival. Audio: a swell of festival crowd noise and a dhol beat.

---

### S10: Payoff + end card (1:20–1:30)
📎 Attach: REF_ammu, REF_riya, REF_nanu, REF_home, REF_style
🎯 Mood reference: **Google "Reunion" (2013)**, the emotional benchmark for a cross-border family reunion through technology. Watch it before generating.

🖼 **Start frame**
> Close two-shot: the mother and daughter sit together on the sofa holding a phone up for a video call, their faces glowing with anticipation. Warm lamp light.

🖼 **End frame** (Nanu cut, a separate 4s clip)
> Nanu from the reference sits in a sunlit Dhaka home with green window grills and a ceiling fan, holding a phone close, her hand pressed to her heart, eyes wet with happy tears, laughing.

🎬 **Video prompt (A, 4s)**
> The call connects; both women light up and wave. Audio: a video-call connect tone, soft laughter.
🎬 **Video prompt (B, Nanu, 4s)**
> She laughs through happy tears and says in Bangla: "মাশাআল্লাহ, কী সুন্দর!" Audio: her voice, a ceiling fan hum, distant Dhaka street sounds.

✂️ **Edit:** at 1:26, cut to the end card built in CapCut or Premiere, not Flow: deep crimson, animated alpona border, the Vingo logo, "আজ কী ডিজাইন করবেন?", "Start free, no credit card" and vingobd.com. Hold it to 1:30.

---

## Step 3: my review checklist (applied to every upload)

- [ ] **Character match:** face, age, hair, sari color and border, glasses, and jewelry all match the REF sheet
- [ ] **Anatomy:** hands and fingers, eyes, teeth; no melted phones or cups
- [ ] **Bangladeshi, not generic South Asian:** sari draping, no bindi on Ammu or Nanu, no Hindi or Devanagari signs, and the flag correct (green field, red disc offset toward the pole)
- [ ] **No AI text or UI:** screens blank and front-facing, signs unreadable
- [ ] **Continuity:** lamp on the left, snowy window on the right, night in S01, S02, S03, S05 and S10
- [ ] **Framing:** subject center-safe for the 9:16 crop
- [ ] **Motion (clips):** no morphing faces, the camera moves as asked, audio matches the cue
