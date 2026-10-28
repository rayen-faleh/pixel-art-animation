# Asset redo list (ChatGPT)

These sprites came out off-model in the first ChatGPT batch. They're still usable in a pinch.
Redo each one in the **same ChatGPT chat** that made the original. If that chat is gone,
start a new one, attach the original sheet from `incoming/` plus `prompts/refs/ref-cast.png`,
and say "the first image is the sheet to fix".

Save the fix as the next version, e.g. `incoming/C2-hero-actions_gpt_v2.png`, then point
`kit/ingest_manifest.json` at it and re-run `python3.12 kit/ingest.py kit/ingest_manifest.json`.

| # | Asset | Problem | Status |
|---|---|---|---|
| 1 | C2 hero actions, pose 8 `blanket` | Came out as a grey ghost blob with no trace of the hero | open |
| 2 | M6 busts, `hero_terror` | Beige rings around the eyes read as glasses (off-model) | open |
| 3 | M2 Changed poses, pose 8 `glass` (all 6 colours) | Smeared, doubled eyes; pinkish pixels in the hands | open |
| 4 | C1 civilians (optional) | Adults stand 39–44 px vs the hero's ~34 px, so they look slightly bigger | open: only if it bothers us on screen |

---

## 1. Hero under the blanket (C2 pose 8)
Attach: `incoming/C2-hero-actions_gpt_v1.png`, `prompts/refs/ref-cast.png` · Size 1536×1024
```
Fix ONLY pose 8 (bottom-right) of the first image. Redraw it as the same hero from the
second image (cream round head, grey hoodie) sitting on the floor with a dark navy
blanket pulled over the head and wrapped around the body like a hood. The face is visible
inside the blanket opening: the hero's own dot eyes, wide and scared, and the top of the
cream round head. Hands clutch the blanket edges at the chin. Same scale and pixel size
as the other seven poses.
Output the full sheet again with poses 1-7 IDENTICAL and only pose 8 replaced.
STYLE: same chunky pixel art, hard edges, no anti-aliasing, 1-pixel outline #14151b.
BACKGROUND: flat solid magenta #FF00FF.
DO NOT: glow, shadows, text, a ghost or sheet-monster look, borders.
```

## 2. Hero terror bust (M6 #3)
Attach: `incoming/M6-busts_gpt_v1.png`, `prompts/refs/ref-cast.png` · Size 1536×1024
```
Fix ONLY the third bust (right) of the first image. It must match the hero from the
second image exactly: cream round head, plain dot eyes (no rings, no glasses, no eye
whites around them), grey hoodie. Expression: frozen terror shown with tiny pupils
(1 pixel each), raised brows (two short dark strokes), a small open mouth, and one hand
pressed over the mouth. Keep the same size and pixel scale as the other two busts.
Output the full sheet again with busts 1-2 IDENTICAL and only bust 3 replaced.
STYLE: chunky pixel art, hard edges, no anti-aliasing, 1-pixel outline #14151b,
top-left two-tone shading.
BACKGROUND: flat solid magenta #FF00FF.
DO NOT: glasses, eye rings, glow, text, borders.
```

## 3. Pressed against glass (M2 pose 8)
Do olive first, then send the recolour follow-up for maroon, navy, teal, plum, brown.
Attach: `incoming/M2-changed-poses-olive_gpt_v1.png`, `prompts/refs/ref-cast.png` · Size 1536×1024
```
Fix ONLY pose 8 (bottom-right) of the first image. The Changed figure (grey round head,
olive hoodie) has its face and both palms pressed flat against an invisible pane of glass:
the lower half of the face is flattened into a straight horizontal edge, the two white
rectangular eyes stay crisp and single (no doubling, no smearing), the too-wide smile is
squashed flat, and both hands are flat grey palms with five short fingers, spread on
either side of the face at eye height. Same scale as the other poses.
Output the full sheet again with poses 1-7 IDENTICAL and only pose 8 replaced.
STYLE: chunky pixel art, hard edges, no anti-aliasing, 1-pixel outline #14151b.
BACKGROUND: flat solid magenta #FF00FF. No magenta or pink anywhere in the figure.
DO NOT: glow, blood, smears, double eyes, text, borders.
```
Recolour follow-up (one per colour):
```
Same sheet, identical in every way (layout, scale, pixels), but recolour every hoodie to
maroon #5c2f38. Change nothing else.
```

## 4. Civilians a touch shorter (optional)
Attach: `incoming/C1-civilians-front_gpt_v1.png`, `prompts/refs/ref-cast.png` · Size 1536×1024
```
Redraw the first image's eight characters exactly as they are (same designs, order,
layout), but make every adult the same height as the hero in the second image (head to
feet), and the child about two-thirds of that. Keep heads the same size; shorten
the bodies and legs slightly instead.
STYLE: same chunky pixel art, hard edges, no anti-aliasing, 1-pixel outline #14151b.
BACKGROUND: flat solid magenta #FF00FF.
DO NOT: glow, shadows, text, borders.
```
If you redo this, repeat it for the `back` and `34left` sheets in the same chat.
