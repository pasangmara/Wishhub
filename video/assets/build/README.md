# Build scripts (draft v2)

- `assemble_v2.py`: normalizes every segment to 1920×1080 / 24fps / 48kHz stereo, trims the Flow clips, applies overlays
  (Delivered card on C7, email card on C8, closing line on C10, Apple logo removal on C6), then joins everything with
  `xfade` / `acrossfade` crossfades. It writes `timeline.json` with the real start time of each segment.
- `mix_v2.py`: reads `timeline.json`, places the voice lines relative to each segment (lines 04 and 05 are split per step),
  adds whooshes, a logo chime and a soft synthesized chord pad (a placeholder until licensed music is chosen),
  side-chain ducks the bed under the voice, and runs two-pass `loudnorm` to −14 LUFS.

The paths at the top of each script point to the working folder used when the draft was made. Change them to your own folders to rebuild.
