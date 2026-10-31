# KEEP PRETENDING: ChatGPT asset pack (Pepper the cat, busts, props, 16:9 sets)

12 images, sent as **two messages** in one ChatGPT chat (ChatGPT can return several images per request; if it stops
early, reply `Continue with image N.`). Same delivery contract as `asset-prompts.md`: flat magenta key, square art
pixels, 1-px outline, no baked lighting, no text.

**Attach to message 1:** `prompts/refs/ref-cast.png`, `prompts/refs/ref-props-small.png`, `prompts/refs/ref-palette.png`
(Optional) also attach `prompts/refs/ref-pepper-sheet.png` and `prompts/refs/ref-pepper-busts.png`: the code-drawn placeholder
poses, labelled, so ChatGPT sees every pose we need in order. Say they are a pose guide only, not the style to copy.
**Attach to message 2:** `prompts/refs/ref-sets.png`, `prompts/refs/ref-palette.png`

**Save as** (in `incoming/`), in the order ChatGPT returns them:

| # | File | What |
|---|---|---|
| 1 | `K1-pepper-cat_gpt_v1.png` | Pepper, normal cat poses + walk cycle |
| 2 | `K2-pepper-cat2_gpt_v1.png` | Pepper, more normal poses |
| 3 | `K3-pepper-upright_gpt_v1.png` | Pepper standing / walking upright |
| 4 | `K4-pepper-uncanny_gpt_v1.png` | Pepper, the wrong poses (in your spot, stretching taller…) |
| 5 | `B1-pepper-busts_gpt_v1.png` | Pepper close-ups (blink, slit pupils, talking, the smile) |
| 6 | `B2-smile-busts_gpt_v1.png` | Human close-ups with "the smile" |
| 7 | `P1-kp-props_gpt_v1.png` | Pet cam, gifts, carrier, bowls |
| 8 | `S1-apartment_gpt_v1.png` | Apartment main room (kitchen, sofa, front door) |
| 9 | `S2-bedroom_gpt_v1.png` | Bedroom |
| 10 | `S3-bathroom_gpt_v1.png` | Bathroom sink + mirror |
| 11 | `S4-shelter_gpt_v1.png` | Animal shelter inside |
| 12 | `S5-street-day_gpt_v1.png` | Street outside the shelter, daytime |

Then run `python3.12 kit/ingest.py kit/ingest_kp.json` (I've already added the entries).

---

## Message 1 (images 1–7): sprites, busts, props

```
I'm attaching three reference images: (1) our pixel-art character cast, (2) small props
at the correct scale, (3) our colour palette. Please generate SEVEN separate images, in
this exact order, one image per item. Every image must follow the SHARED RULES below.

SHARED RULES (apply to every image)
- Retro pixel art that matches reference (1) exactly in pixel size and finish: very low
  resolution, large uniform square pixels, hard edges, no anti-aliasing, no blur, no
  smooth gradients (ordered dither only), a 1-pixel near-black outline #14151b around
  every figure and object, light from the top-left, simple two-tone shading, muted palette.
- Background: one perfectly flat solid magenta #FF00FF. No magenta or pink anywhere in
  the art (the cat's nose and inner ears are dark grey, never pink).
- Sprites are separated by generous empty magenta space, one figure per slot, all at the
  same scale, lowest point of every sprite on one shared baseline per row.
- DO NOT draw: glow, bloom, light rays, drop shadows, ground shadows, text, letters,
  numbers, logos, labels, borders, frames, grid lines, checkerboards, watermarks, blood.
- Eyes are flat coloured pixels (never glowing).

THE CAT, "PEPPER" (same design in every image)
A grey tuxedo cat in the same cute, chunky style as the round-head characters in
reference (1): slate-grey body, darker grey back and tail, a clean white chest bib,
white muzzle patch, four white socks, small dark-grey nose, yellow-green eyes drawn as
flat 2x2 pixel blocks with a 1-pixel dark pupil. Slightly chunky, round head, short legs,
thick tail. SCALE: sitting, the cat is about HALF the height of the characters in
reference (1) (roughly the height of their round head plus shoulders). Standing upright
on its back legs it is about THREE QUARTERS of their height. Side views face RIGHT.

IMAGE 1 (1536x1024): "Pepper, normal cat". 2 rows x 4.
Row 1: (1) sitting, facing the viewer (2) sitting, side view (3) loaf pose, paws tucked,
side view (4) asleep, curled in a ball, tail around the nose.
Row 2: a 4-frame walk cycle on four legs, side view facing right: (5) right front leg
forward (6) legs passing (7) left front leg forward (8) legs passing, tail up.

IMAGE 2 (1536x1024): "Pepper, more normal poses". 2 rows x 4.
Row 1: (1) standing on four legs facing the viewer (2) rubbing its head against
something on the right, eyes closed, side view (3) head down eating, side view
(4) sitting with its back to the viewer, head turned to look back over its shoulder.
Row 2: (5) sitting, back view, head facing away (6) lying on its side, relaxed
(7) crouched low and still, ready to pounce, side view (8) sitting facing the viewer
with both eyes closed (mid slow-blink).

IMAGE 3 (1536x1024): "Pepper standing upright like a person". 2 rows x 4. This is the
eerie part: the cat stands on its BACK LEGS ONLY, body perfectly straight and stiff like
a person, front legs hanging straight down at its sides like arms. Calm, blank face.
Row 1: (1) sitting up on its haunches, front paws lifted off the ground (halfway
standing) (2) almost upright, back straightening (3) fully upright, facing the viewer,
arms at its sides, staring straight ahead (4) fully upright, side view facing right.
Row 2: (5) walking upright on two legs, side view, left leg forward (6) walking upright,
right leg forward (7) fully upright, seen from directly behind (8) fully upright, facing
the viewer, head tilted to one side like a person looking at a phone.

IMAGE 4 (1536x1024): "Pepper, wrong poses". 2 rows x 4.
Row 1: (1) lying on its back like a sleeping person, one front leg resting across its
eyes, back legs straight (2) sitting upright in a person's posture on its haunches with
a straight back, front paws resting forward on an invisible table edge (3) standing
upright seen from behind, normal upright height (4) the same but taller and thinner,
body slightly stretched.
Row 2: (5) the same, even taller and thinner, as tall as the characters in reference
(1), limbs too long (6) fully upright facing the viewer, mouth open in a human-shaped
open mouth as if speaking (a dark oval, no teeth) (7) a perfect normal cat sitting on
all fours, eyes squeezed shut, contented (8) fully upright facing the viewer in near-
darkness: body almost black, only the yellow-green eyes visible as flat pixels.

IMAGE 5 (1536x1024): "Pepper close-ups". Larger scale: each is a head-and-shoulders
close-up about 64 art pixels square (same pixel size as before, so much more detail).
2 rows x 3, all facing the viewer.
Row 1: (1) calm, eyes open (2) half-blink, eyes half closed (3) eyes fully closed.
Row 2: (4) staring straight at the viewer, pupils narrowed to thin vertical slits,
perfectly still (5) mouth open as if saying a word, a human-shaped mouth, dark inside,
no teeth (6) the mouth corners curled up into a closed, human-like smile that is
slightly too wide. Uncanny, never gory.

IMAGE 6 (1536x1024): "The smile" human close-ups. Same close-up scale as image 5, in the
style of the round-head characters of reference (1). 1 row of 5, facing the viewer.
(1) the cream-headed protagonist from reference (1), neutral face (2) the same
protagonist with a closed-mouth smile that is a little too wide and a little too
symmetrical, head tilted slightly to the right, eyes calm and blank (3) a young woman
with a dark ponytail and a mustard sweater (4) a man with short brown hair, a short
beard and a navy jacket (5) an older woman with grey hair in a bun and round glasses.
Persons 3, 4 and 5 all wear the EXACT SAME smile and head tilt as person 2.

IMAGE 7 (1536x1024): "Props". Match the scale of reference (2). 3 rows x 4.
Row 1: (1) a small white home pet camera: a round dome on a short stand, dark lens
(2) a cat food bowl, empty (3) the same bowl full of brown kibble (4) a plain mug.
Row 2: (5) a smartphone lying face up, screen dark (6) the same smartphone with a
cracked screen (7) a dark hair scrunchie (8) a single house key on a ring with a plain
round blank tag.
Row 3: (9) a plain white hospital wristband, closed in a loop, blank (10) a plastic pet
carrier seen from the front, wire grille door closed (11) the same carrier with the
grille door open (12) a key hook rack with three empty hooks.
```

## Message 2 (images 8–12): 16:9 sets

```
Now five ENVIRONMENT plates in the attached set style (reference: our pixel sets) and
palette. Separate images, in this order.

SHARED RULES FOR PLATES
- Landscape 1536x1024. Keep everything important inside the middle horizontal band:
  the top 8% and bottom 8% will be cropped to 16:9.
- Front-on, straight-ahead view like a stage set, about 240 art pixels wide, large uniform
  square pixels, hard edges, no anti-aliasing, ordered dither only, 1-pixel dark lines.
- EMPTY of people and animals. The floor must be clear for characters to be added.
  Leave visible floor in the bottom quarter.
- Lighting is flat and neutral (dusk-grey interior, everything readable). All lamps,
  screens and lights are drawn SWITCHED OFF. No glow, no light pools, no light rays.
- No text, letters, numbers, posters with writing, logos, brands, borders or watermarks.
- Scale: the doors are about twice the height of the characters in our cast.

IMAGE 8: "Apartment main room". A small, cheap, one-bedroom city apartment seen from
the front. LEFT third: a tiny kitchen: fridge, counter with a sink, an upper cabinet and
a bare shelf on the wall above the counter, a small round table with two chairs in
front. MIDDLE third: a worn two-seat sofa facing the viewer with a folded blanket, a low
coffee table, a floor lamp (off), a window with half-open blinds showing night city
roofs. RIGHT third: the front door (plain, with a door chain and a deadbolt), a small
coat rack, and an open doorway to a dark short hallway. Muted navy, grey and brown.

IMAGE 9: "Bedroom". Same apartment. A single bed seen from the side across the middle of
the frame (pillow on the LEFT end, a rumpled duvet), a small nightstand with a lamp
(off), a window with blinds (closed) on the back wall, the bedroom door on the RIGHT,
partly open onto a dark hallway, and a small empty shelf high on the left wall.

IMAGE 10: "Bathroom". A small bathroom seen straight on: a sink with a cabinet under it,
a large rectangular mirror above the sink (the mirror surface is plain dark grey-blue,
reflecting nothing), a towel on a rail, plain tiles. Light off.

IMAGE 11: "Animal shelter, inside, daytime". Bright, slightly tired room: on the LEFT a
reception counter with a computer monitor (screen off) and a bell; on the RIGHT a wall
of stacked metal cat cages, 3 rows x 3, all EMPTY, each with a small blank card holder;
a plain bulletin board with blank pinned papers; tiled floor; fluorescent ceiling
lights drawn off. Palette: pale green walls, grey metal, warm wood counter.

IMAGE 12: "City street outside the shelter, daytime". A quiet sidewalk in sunshine: a
low building with glass double doors and a plain canopy (no signage text), a bench, a
small tree, parked car at the kerb, clear sky. Palette: warm daylight, soft blue sky.
```

---

## If something comes out wrong

- Ask in the **same chat**: `Image 3 again, keep everything identical but <fix>.` Save as `_gpt_v2.png` and update the
  file name in `kit/ingest_kp.json`.
- Sheets that report MISMATCH on ingest: lower that source's `merge` (sprites too close) or raise it (a sprite split
  into pieces), same as the main kit.
- Until these arrive, the film uses code-drawn placeholders with the same frame names
  (`kit/cast_pepper.py`), so swapping is just re-running the ingest.
