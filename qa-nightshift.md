# QA: NIGHT SHIFT, Part 1 (out/night-shift-part1.mp4)

## Technical (verified)
- ffprobe: h264 1080×1920 @ 30 fps + AAC, 77.57 s. blackdetect (≥1.5 s): no long black gaps.
- Mix: −13.9 LUFS integrated, −2.2 dBFS peak. 29 synthesized SFX events + drone bed (`ns-cues.json`).
- Narration: Chatterbox default voice (same settings as LIGHTS OUT). All 26 lines transcribed
  back at similarity 1.00. Approximate times on "AM." and "walkie-talkie." (neither is a hard cue).
- `tsc --noEmit` clean.

## Bug found + fixed during this build (also affected LIGHTS OUT)
- faster-whisper read our 24 kHz takes as 16 kHz, so every word time inside a take was ~1.5× late.
  Fixed in `scripts/chatterbox_narrate.py` (resample to 16 kHz before transcribing). Both scripts
  were realigned from cached takes (same performance). LIGHTS OUT was re-rendered:
  out/lights-out-part1.mp4 (78.25 s, −1.7 dBFS peak).

## Visual (contact sheets at 0.5× + full-res frames)
Fixed after the first pass: oversized walkie/fob (new hero-scaled walkie, fob at 0.5×),
crawler visible before its reveal, dark knee-gap/wave shots, hiding shot over-zoomed with the
walkie in front of the driver's face, hero out of frame at the bang, unreadable driver on
CCTV, swarm overlapping, church too dark.

## Not verified / known limits
- **I could not listen to the audio**, so the SFX balance (bass under narration, breathing, bang) needs a listen.
- Motion was judged from stills and frame strips, not playback.
- CCTV shots use sprites at 0.55× because the gas-station plate is at a smaller scale. The CCTV filter hides
  the pixel-size difference, but it's a deliberate exception to the one-density rule.
- The driver's dive is his standing sprite rotated; the hand over his mouth is only implied (see prompts/future-additions.md).
