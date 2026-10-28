# QA — LIGHTS OUT, Part 1 (out/lights-out-part1.mp4)

## Technical (verified)
- ffprobe: h264 1080×1920 @ 30 fps, AAC stereo, 78.25 s (target 70–90 s).
- Mix: −14.0 LUFS integrated, −1.5 dBFS peak (ebur128).
- blackdetect (≥1.5 s, pix_th 0.04): no long black gaps. The intended dark hold after "His light goes out" sits under that threshold.
- `tsc --noEmit` clean.

## Narration (verified by transcription, NOT by ear)
- Chatterbox built-in voice (no reference clip), exaggeration 0.55, cfg 0.4, atempo 0.92. Median F0 ≈ 140 Hz.
- faster-whisper small.en transcript of every take matched the script (similarity 1.00 on all 27 lines, first seed).
- One word time is approximate: "AM." in L01 (whisper heard "A .M."), which is not a keyword.
- Alert lines (L02, L06, L16) use a radio band-pass + slap echo; Mom (L25) is low-passed, as if heard through the door.
- **I could not listen to the audio in this environment.** Pronunciation, breaths, the fx timbre and the SFX balance still need a listen.

## Visual (contact sheets at 0.5× plus full-res frames)
Inspected: hook, alert 1, lamp, hall switch, alert 2, brightness insert, lit window, Mr. Hale, crowd reveal, light out, turn (6-frame strip), faces, OTS alert 3, Mom flare, eyes, press, kitchen, "makes light", knock, Mom at the door, face turn, door-window eyes (3 frames), choice.

Fixes made after the first pass:
- Kitchen props were taller than the hero → new small `items` atlas; the inventory panel no longer covers the scene.
- Door-window eyes had about 0.5 s before the choice → L26 pause raised to 2.3 s (~1.7 s of eyes now).
- Brightness phone collided with the captions → shorter phone placed higher.
- Mom flare blew the hero out → flare reduced. Rings on "finds" made lighter.
- Mr. Hale too low in the window → raised so his shoulders show.

Known limitations / candidates for revision:
- Motion was checked from frame strips and stills, not watched at full speed.
- The hero in the Mom flare is still mostly white (reads as screen light).
- The kitchen hero sits at the right edge of the frame.
