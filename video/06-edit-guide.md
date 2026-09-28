# Edit & Assembly Guide

## 0. Prep checklist (before opening the editor)
- [x] **US card set**: done, 12 cards in `assets/cards/` (1080×1350, brand colors, sample sender "Summit & Co."):
      Work Anniversary ("5 Years, Mike Johnson") · Happy Birthday · Welcome to the Team · Employee Spotlight ·
      Client Thank You ("10 Years Together") · Thanksgiving · Happy Holidays · Happy New Year 2027 ·
      4th of July · Diwali · Eid Mubarak · Lunar New Year. Also upload them to the Wish Hub library.
- [ ] **Screen recordings** of wishhub.digitalhubbd.com at 1920×1080 or higher: browse the library → edit the message → pick a date → send confirmation → dashboard with upcoming events.
      Use clean demo data with US names (Mike, Laura, Jessica…), hide the browser bookmarks bar, and zoom the browser to 110–125% for readability.
- [ ] **Logo files:** Wish Hub logo as PNG with a transparent background (plus the white version)
- [ ] **Flow clips** C1–C10 (see `03-flow-prompts.md`)
- [ ] **Voiceover** lines 01–08 (see `04-voiceover.txt`)
- [ ] **Music track + SFX** (see `05-music-sfx-brief.md`)

## 0.5 Clip trims (from the Flow Omni takes)
| Clip | Use | Fix in the edit |
|---|---|---|
| C1 busy office | 3.0s → 7.5s | Skip the first 2.8s (purple light streak) |
| C2 realization | 3.6s → 9.1s | Skip 2.4–3.5s (AI "✓" pop-up) |
| C3 butterfly | 3.5s → 10.0s, hold the last frame 1.5s | Logo + "We Remember It For You." fade in over the particle glow |
| C6 Rachel relaxed | 2.0s → 10.0s | **Blur/mask the Apple logo** on the laptop lid |
| C7 Mike | 4.0s → 10.0s (2–4s optional hand insert) | none |
| C4 cards | 1.8s → 4.0s | Only the real "Happy Holidays" moment; the rest of the showcase uses the real card PNGs |
| C8 Laura | 4.5s → 10.0s | Email card overlay (card 05) slides in at +0.6s |
| C9 celebration | 0.0s → 5.5s | none |
| C10 window | 3.0s → 10.0s | Ends on white, straight into the end card |

**Apple logo on C6:** `delogo=x=295:y=574:w=42:h=54` on the 1280×720 source (the laptop doesn't move, so one static box works).

## 0.6 Draft v1 assembly (95.5s, 1920×1080, 24fps)
| Start | Segment | VO |
|---|---|---|
| 0:00.0 | Hook (C1 + C2 + overlays) | 01 @ 0:00.6 |
| 0:10.0 | Turn (C3 + logo reveal) | 02 @ 0:14.8 |
| 0:18.0 | C4 Happy Holidays moment | |
| 0:20.2 | Showcase (motion) | 03 @ 0:20.9 |
| 0:31.0 | How it works (mockup) | 04 split per step @ 0:31.4 / 0:33.4 / 0:35.6 |
| 0:40.0 | C6 Rachel relaxed | |
| 0:43.0 | Your brand (motion) | 05 split @ 0:43.5 / 0:44.8 / 0:45.7 |
| 0:49.0 | C7 Mike | |
| 0:55.0 | Dashboard (mockup) | 06 @ 0:55.4 |
| 1:01.5 | C8 Laura + email overlay | |
| 1:07.0 | Offer (motion) | 07 @ 1:07.8 |
| 1:17.0 | C9 celebration | |
| 1:22.5 | C10 window → white | |
| 1:29.5 | End card | 08 @ 1:30.1 |

Mix: Flow ambient audio +4 dB, side-chain ducked under the VO; VO +12 dB; loudnorm to about −14 LUFS. **No music yet.**


Ready-made assets in `assets/`: the logo (`wishhub-logo.png`, transparent), hook overlays, 12 US cards, and a 4K card grid.

## 1. Timeline (16:9 master, 24fps, 3840×2160 or 1920×1080)
| Time | V1 (footage) | V2 (overlays / graphics) | Audio |
|---|---|---|---|
| 0:00–0:05 | C1 office | Text: "We forget. We get busy." | Ambience, music intro, VO 01 |
| 0:05–0:10 | C2 Rachel close-up | Calendar tile + Laura's email preview (slide-in UI cards); text: "We miss important moments." | Ding, tick, heartbeat |
| 0:10–0:16 | C3 butterfly → white | Wish Hub logo reveal; text: "We remember it for you." | Whoosh, chime, VO 02 |
| 0:16–0:23 | C4 floating cards | "One platform. Every celebration." | Beat drop, whooshes, VO 03 |
| 0:23–0:30 | C5 / Canva grid zoom-out | "Ready to share." | Sparkle |
| 0:30–0:42 | Screen recording ⇄ C6 | Step labels: Discover · Personalize · Schedule · Send | Clicks, VO 04 |
| 0:42–0:48 | Card-branding animation | Logo pop → name type-on → message | Pop, typewriter, VO 05 |
| 0:48–0:54 | C7 Mike's smile | "Your logo. Your message. Their name." | Buzz, laugh |
| 0:54–1:00 | Dashboard screen recording | Feature chips animate in | Pops, VO 06 |
| 1:00–1:06 | C8 Laura | Email with "10 Years Together" card on her laptop screen; "Set it once. It runs every year." | Email chime |
| 1:06–1:16 | Offer gradient plate | "Try Wish Hub free." + [Start Free Trial] [Book a Free Demo] | Click, chime, VO 07 |
| 1:16–1:22 | C9 celebration | Screen-replace the wall monitor with the Mike card | Laughter, VO 08 |
| 1:22–1:28 | C10 → white | "Every Occasion. One Beautiful Wish." → logo lockup → URL + "Book your free demo" | Ending hit, sparkle |

## 2. Style rules
- **Transitions:** mostly straight cuts on the beat. Use a **butterfly-wipe** or light-leak only at: hook→turn (0:10), turn→showcase (0:16), offer→close (1:16).
- **Text:** max 6 words on screen at a time, 1.5–2.5s each. Sans-serif (Poppins/Inter) for body, serif (Cinzel Decorative) for taglines only.
- **Colors:** white backgrounds, magenta + royal-blue accents, a light orange glow for warmth. Keep it airy and premium.
- **Motion:** smooth ease-in/ease-out, no bouncy cartoon animations. Keep a subtle 102–105% slow zoom on still graphics.
- **Captions:** burn in captions for the social cuts (most social video is watched muted). Keep them optional on YouTube.
- **Color grade:** match all Veo clips to one warm look. Lift the shadows slightly on the hook, and make the ending brighter than the opening (dark → light arc).

## 3. Tools
- **CapCut (desktop):** easiest; has auto-captions and a good template/text library
- **DaVinci Resolve (free):** best color matching and audio (Fairlight)
- **Premiere Pro + After Effects:** best for the logo reveal, UI animations and monitor screen replacement

## 4. Exports
| Version | Ratio | Resolution | Use |
|---|---|---|---|
| Master (~88s) | 16:9 | 3840×2160 or 1920×1080, H.264, 20–40 Mbps | Website, YouTube, sales emails, pitch meetings |
| LinkedIn | 16:9 or 1:1 | 1920×1080 / 1080×1080 | LinkedIn feed + ads |
| Social cut (30s) | 9:16 | 1080×1920 | Reels, TikTok, Shorts |
| Silent loop (15s) | 16:9 | 1920×1080, no audio | Trade-show screens, website hero |

Audio: AAC 320 kbps, -14 LUFS integrated, -1 dBTP true peak.

## 5. Final QA before sending to US clients
- [ ] No Bangladesh-only references in the US cut (phone number, BD-specific holidays as the lead)
- [ ] Every card, name and date is spelled correctly and uses US date format (e.g. "Nov 27")
- [ ] The CTA URL is correct and live, and the demo booking link works
- [ ] Music and SFX licenses cover commercial use
- [ ] Watch once muted: does it still make sense with captions only?
- [ ] Watch once on a phone: is the text readable?
