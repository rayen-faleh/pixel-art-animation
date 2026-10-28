# Pixel Dread asset prompt pack: Nano Banana + ChatGPT

Prompts for growing the LIGHTS OUT / Pixel Dread kit with image models. Every prompt
asks for output our pipeline can ingest: chunky pixel art on a flat magenta key,
separated sprites on a shared baseline, no baked lighting, and no text.

Drop raw outputs into `incoming/` named `<asset-id>_<model>_v<n>.png`
(e.g. `M2-changed-poses_nb_v1.png`, `M2-changed-poses_gpt_v1.png`). The ingest step
(`kit/ingest.py`, built once the first images arrive) will:
1. key out magenta,
2. detect the real pixel size and resample to clean 1:1 art pixels,
3. snap colours to the kit palette,
4. cut sprites by connected regions (rows top→bottom, left→right) and pad them into cells with the feet pivot,
5. write `public/sprites/<name>.png/.json` or `public/sets/<name>_bg.png`.

So the grid doesn't need to be perfect. Separation, scale and style consistency matter much more.

---

## 0. The delivery contract (why the prompts say what they say)

| Rule | Reason |
| --- | --- |
| Flat **#FF00FF magenta** background on sprites/props | Clean key on both models (Nano Banana has no alpha; GPT's alpha edges are soft). Nothing in the art may use magenta or pink. |
| Uniform square "art pixels", no anti-aliasing, no blur, no gradients except ordered dither | Re-pixelation only works if each block is one flat colour. |
| 1-pixel near-black outline `#14151b` on characters/props, light from top-left, 2-tone shading | Matches `characters.py` / `sets.py`. |
| **No baked lighting**: no glow, bloom, light rays, lens flare, cast-light pools; lamps/screens drawn OFF; monster eyes are flat white pixels only | Remotion adds every light so it can flicker, pulse and switch off on cue. |
| Sprites separated by clear magenta space, same scale, feet on a shared baseline per row, one figure per slot | Connected-region slicing + feet pivot. |
| No text, labels, numbers, logos, borders, grid lines, checkerboards, frames, drop shadows, signatures | The model invents garbage text; the ingest can't remove it. |
| Environments: empty of characters, nothing important in the outer 8% left/right, floor area clear for actors | Actors are composited on top; GPT plates are cropped from 2:3 to 9:16. |
| Uncanny, never gory: no blood, wounds, organs, or teeth close-ups | Brief: terror over revulsion; platform safety. |

Logical (art-pixel) sizes the ingest targets:

| Kind | Logical size | Notes |
| --- | --- | --- |
| Human / Changed character | 32 × 40 cell, figure ≈ 18 wide × 34 tall | round head ≈ 17 px diameter, short legs |
| Large monster | 48 × 96 (tall), 48 × 32 (crawler) | |
| Close-up bust | 64 × 64 | for insert shots |
| Prop (large) | ≤ 64 × 140 | doors, shelves, furniture |
| Prop (small) | 16 × 20 | items on counters |
| HUD icon | 16 × 16 | |
| Environment plate | 135 × 240 (9:16) | 1 art px = 8 screen px |

## 1. Reference images to attach

Made by `python3.12 kit/make_refs.py .` → `prompts/refs/`:

- `ref-cast.png`: the hero and the Changed. Always attach for characters and monsters.
- `ref-sets.png`: bedroom, hall, street, kitchen plates. Attach for environments.
- `ref-props-large.png`, `ref-props-small.png`: prop scale and finish.
- `ref-palette.png`: the palette swatches. Attach when colours drift.

**Nano Banana** is strong with references and iterative edits. Attach 1–3 images and
refer to them as "the first image", "the second image". Keep the same chat when
making variants of one asset, and say "keep everything else identical".
Set the aspect ratio in the UI/API when you can (Gemini app/AI Studio: 9:16, 16:9, 1:1, 3:2…).

**ChatGPT (GPT image)** follows structured spec lists well. It offers 1024², 1536×1024
and 1024×1536. Attach the reference images to the message. It *can* return transparent
PNGs, but use the magenta key anyway for parity. If you try transparency, describe only the
subject and never write "transparent background" as scene content, or it may paint a checkerboard.

---

## 2. Shared style blocks

These are already folded into every prompt below. Keep them if you write new prompts.

**NB style sentence**
> Draw it as crisp retro pixel art matching the style of the attached reference: very low resolution with large, uniform square pixels, hard edges, no anti-aliasing, no blur, no soft gradients (only ordered dithering), a 1-pixel near-black outline (#14151b) around every figure, light coming from the top-left with simple two-tone shading, and a muted night palette of navy, slate grey and desaturated earth tones. The background is one perfectly flat solid magenta (#FF00FF), and magenta or pink appears nowhere in the art. There is no glow, bloom, light rays or drop shadows, and no text, labels, borders or grid lines.

**GPT style block**
```
STYLE: retro pixel art, very low resolution, large uniform square pixels, hard edges,
no anti-aliasing, no blur, no smooth gradients (ordered dither only), 1-pixel near-black
outline #14151b, top-left light, two-tone shading, muted night palette (navy, slate,
desaturated earth tones). Match the attached reference images exactly in proportions
and finish.
BACKGROUND: one flat solid magenta #FF00FF fill. No magenta/pink inside the art.
DO NOT: glow, bloom, light rays, lens flare, drop shadows, cast light, text, letters,
numbers, logos, labels, borders, frames, grid lines, checkerboard, watermark, blood, gore.
```

---

## 3. Characters

### C1: Civilian cast (`C1-civilians`), 8 humans for the town
Use: neighbours, Mom, background people before they change. 32×40 cells.

**Nano Banana** (aspect 16:9, attach `ref-cast.png`)
> Using the first image as the exact style and proportion reference, create a sprite sheet of eight new human characters in the same cute round-head pixel-art style: a big perfectly round pale head about half the body height, simple dot eyes with a tiny white highlight, small mouth, short torso, round hands, and short stubby legs. Arrange them in two rows of four, all facing the viewer in a neutral standing pose, all exactly the same scale as the characters in the reference, with clear empty space between them and their feet aligned on a common baseline in each row. Top row: a middle-aged mother with a hair bun and a beige cardigan; an elderly bald man with round glasses and a brown knitted vest (Mr. Hale); a small child about two-thirds the height of the adults, in yellow pajamas; a delivery driver in a dark cap and padded vest. Bottom row: a nurse in teal scrubs; a teenager with a hood and headphones around the neck; a jogger in a navy track jacket; a security guard in a plain grey uniform with no badges or insignia. Give each a distinct silhouette through hair, hats and clothing shape, not through extra detail. Draw it as crisp retro pixel art matching the reference: large uniform square pixels, hard edges, no anti-aliasing, no blur, no soft gradients, 1-pixel near-black outline (#14151b), top-left light with two-tone shading, muted night palette. Background is one flat solid magenta (#FF00FF), with no magenta or pink in the characters. No glow, no shadows on the ground, no text or labels.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
Create a pixel-art sprite sheet of 8 new human characters that exactly match the
attached reference's style and proportions.

CHARACTER DESIGN: big perfectly round pale head (~half body height), dot eyes with a
tiny white highlight, small mouth, short torso, round hands, short stubby legs.
Neutral standing pose, facing the viewer.

LAYOUT: 2 rows x 4, generous empty magenta space between figures, every figure the
same scale as the reference, feet on one shared baseline per row. One figure per slot.

ROW 1: (1) mother, hair bun, beige cardigan (2) elderly bald man, round glasses,
brown knitted vest (3) small child ~2/3 adult height, yellow pajamas (4) delivery
driver, dark cap, padded vest.
ROW 2: (5) nurse, teal scrubs (6) teenager, hood up, headphones around neck
(7) jogger, navy track jacket (8) security guard, plain grey uniform, no badges.
Distinct silhouettes via hair/hats/clothes shapes.

STYLE: retro pixel art, very low resolution, large uniform square pixels, hard edges,
no anti-aliasing, no blur, no smooth gradients, 1-pixel near-black outline #14151b,
top-left light, two-tone shading, muted night palette.
BACKGROUND: flat solid magenta #FF00FF. No magenta/pink in the art.
DO NOT: glow, ground shadows, text, labels, numbers, borders, grid lines, watermark.
```

**Follow-up (both):** "Same eight characters, same order and scale, now each seen from directly behind (back of head, no face)." Then "…now each in a three-quarter view facing left." That gives us a turnaround.

---

### C2: Hero action poses (`C2-hero-actions`), poses the code rig can't do
Use: hiding, running, peeking. Must stay on-model with the hero.

**Nano Banana** (16:9, attach `ref-cast.png`)
> The first image shows our protagonist: the character on the far left with the cream round head and grey hoodie. Draw this exact same character, identical colours, proportions and outline, in eight new poses arranged two rows of four, same scale as the reference, clear empty space between poses, feet or lowest point on a shared baseline per row. Top row: crouching low with arms wrapped around knees; running to the right in side view, mid-stride; tiptoeing in side view, one finger to the lips; peeking sideways around an invisible door edge with only half the body leaning out. Bottom row: lying flat on the stomach, seen from the side; sitting on the floor with the back against an invisible wall, knees up, scared face; holding a phone face-down against the chest with both hands, eyes wide; pulling a blanket over the head so only the eyes show above it. Expressions use the same simple dot eyes and tiny mouths as the reference (worried, scared, shocked). Crisp retro pixel art: large uniform square pixels, hard edges, no anti-aliasing, no blur, 1-pixel near-black outline, top-left two-tone shading. The phone screen is dark, not glowing. Flat solid magenta (#FF00FF) background, no magenta in the art, no glow, no shadows, no text.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
Redraw the leftmost character in the attached reference (cream round head, grey
hoodie) in 8 new poses. Keep identical colours, proportions, outline and face style.

LAYOUT: 2 rows x 4, same scale as reference, clear magenta space between poses,
lowest point of each pose on a shared baseline per row.
ROW 1: (1) crouching, arms around knees (2) running right, side view, mid-stride
(3) tiptoeing, side view, finger to lips (4) peeking around an invisible door edge,
half the body leaning out.
ROW 2: (5) lying on stomach, side view (6) sitting on floor, back to invisible wall,
knees up, scared (7) clutching a phone face-down to the chest, eyes wide
(8) blanket pulled over head, only eyes showing.
Phone screen dark (not lit).

STYLE: retro pixel art, very low resolution, large uniform square pixels, hard edges,
no anti-aliasing, no blur, 1-pixel near-black outline #14151b, top-left two-tone
shading, muted night palette.
BACKGROUND: flat solid magenta #FF00FF. No magenta/pink in the art.
DO NOT: glow, shadows, text, labels, borders, grid lines.
```

---

## 4. Monsters: the Changed and beyond

### M1: Transformation stages (`M1-changed-stages`)
Use: a reusable "it's spreading" beat. One person, five stages, left → right.

**Nano Banana** (16:9, attach `ref-cast.png`)
> Using the first image as the style reference, create a single horizontal row of five sprites showing the same ordinary person slowly turning into one of "the Changed" (the grey-headed figures with white eyes in the reference). Same character, same scale, same standing pose facing the viewer, evenly spaced with clear empty space between, feet on one baseline. Stage 1: normal human, cream round head, olive hoodie, neutral face. Stage 2: skin slightly paler and greyer, eyes half-lidded and blank. Stage 3: head now mostly grey, dark faint vein lines on one cheek drawn as single darker pixels, eyes turning white at the centre, mouth a flat line. Stage 4: fully grey head, solid white eyes with no pupils, a thin smile starting to stretch too wide. Stage 5: the full Changed, grey head, solid white rectangular eyes, a smile that stretches almost from ear to ear, posture slightly too straight and arms hanging a little too long. It must be eerie, never gory: no blood, wounds or open flesh. The eyes are flat white pixels with no glow around them. Crisp retro pixel art: large uniform square pixels, no anti-aliasing, 1-pixel near-black outline, top-left two-tone shading. Flat solid magenta (#FF00FF) background, no glow, no text.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
One horizontal row of 5 sprites: the same person transforming into "the Changed"
(grey-headed, white-eyed figures in the attached reference). Same scale, standing,
facing viewer, evenly spaced, shared baseline.

1. Normal human: cream round head, olive hoodie, neutral face.
2. Paler/greyer skin, blank half-lidded eyes.
3. Head mostly grey, faint darker vein pixels on one cheek, eyes whitening, flat mouth.
4. Fully grey head, solid white pupil-less eyes, smile starting to stretch too wide.
5. Full Changed: grey head, solid white rectangular eyes, ear-to-ear smile, posture
   too straight, arms slightly too long.
Eerie, not gory: no blood, wounds or flesh. Eyes are flat white pixels, no glow.

STYLE: retro pixel art matching the reference, large uniform square pixels, hard
edges, no anti-aliasing, 1-pixel near-black outline #14151b, top-left two-tone shading.
BACKGROUND: flat solid magenta #FF00FF. No magenta/pink in the art.
DO NOT: glow, light rays, shadows, text, labels, borders, gore.
```

---

### M2: Changed pose library (`M2-changed-poses`)
Use: the main monster vocabulary. Stillness and wrong angles, not violence.

**Nano Banana** (16:9, attach `ref-cast.png`)
> Using the first image as the style reference, draw eight poses of one of "the Changed": the grey round-headed figure in an olive hoodie with solid white eyes and a too-wide smile. Two rows of four, all exactly the same scale as the reference figures, clear empty magenta space between poses, feet on a shared baseline per row. Top row: standing perfectly still, arms straight down, staring at the viewer; seen from directly behind, completely still; head tilted ninety degrees sideways onto the shoulder, still smiling; both arms raised and reaching forward toward something above, fingers spread. Bottom row: mouth stretched open into a tall dark oval (just a black shape, no teeth or tongue); down on all fours like an animal, head raised toward the viewer; standing with arms hanging unnaturally long, hands reaching below the knees; face and both palms pressed flat against an invisible pane of glass, cheeks slightly squashed. The white eyes are flat white pixels with no glow. Uncanny and unsettling, never gory: no blood or wounds. Crisp retro pixel art: large uniform square pixels, hard edges, no anti-aliasing, 1-pixel near-black outline, top-left two-tone shading, muted palette. Flat solid magenta (#FF00FF) background, no glow, no ground shadows, no text.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
8 poses of one "Changed" figure: grey round head, olive hoodie, solid white eyes,
too-wide smile (see attached reference). Same scale as reference.

LAYOUT: 2 rows x 4, clear magenta space between poses, shared baseline per row.
ROW 1: (1) perfectly still, arms down, staring at viewer (2) back view, still
(3) head tilted 90 degrees onto shoulder, smiling (4) both arms reaching up/forward,
fingers spread.
ROW 2: (5) mouth stretched into a tall black oval (no teeth/tongue) (6) on all fours,
head raised toward viewer (7) arms unnaturally long, hands below knees (8) face and
palms pressed flat against invisible glass, cheeks squashed.
Eyes: flat white pixels, no glow. Uncanny, not gory.

STYLE: retro pixel art, large uniform square pixels, hard edges, no anti-aliasing,
1-pixel near-black outline #14151b, top-left two-tone shading, muted palette.
BACKGROUND: flat solid magenta #FF00FF. No magenta/pink in the art.
DO NOT: glow, shadows, blood, text, labels, borders, grid lines.
```

**Follow-up (both):** "Same eight poses, identical in every way, but recolour the hoodie to [maroon #5c2f38 | navy #2f3b5c | teal #2f5c57 | plum #4b3a5c | brown #5c4632]." Do one per crowd colour.

---

### M3: The Tall One (`M3-tall-one`), a rare, bigger threat
Use: the Part 2+ escalation. About 2.5× human height. 48×96 cells.

**Nano Banana** (16:9, attach `ref-cast.png`)
> Using the first image for style, palette and scale (the small figures are normal humans), design a new monster called "the Tall One": a Changed person stretched to about two and a half times human height, extremely thin, with the same perfectly round grey head (same head size as the humans, so it looks too small for the body), solid white eyes and an ear-to-ear smile, a torn-free but stretched dark grey hoodie hanging loosely, and very long thin arms reaching to its knees. Show four sprites in one row with clear empty space between them, on a shared baseline: front view standing still; side view, slightly hunched, head bent forward; back view; and bending down at the waist to peer through a low window, head at human-height level. For scale, put one ordinary human from the reference next to the first pose, at its exact original size. Uncanny, never gory. Eyes are flat white pixels with no glow. Crisp retro pixel art: large uniform square pixels, hard edges, no anti-aliasing, 1-pixel near-black outline, top-left two-tone shading. Flat solid magenta (#FF00FF) background, no glow, no shadows, no text.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
New monster "the Tall One", in the attached reference's pixel style. The small figures
in the reference are normal human size.

DESIGN: a Changed person stretched to ~2.5x human height, very thin. Same round grey
head as the humans (same head size, so too small for the body), solid white eyes,
ear-to-ear smile, loose stretched dark grey hoodie, very long thin arms to the knees.

LAYOUT: one row, shared baseline, clear magenta space:
(0) one ordinary human copied from the reference at exact size, for scale
(1) front view, still (2) side view, hunched, head bent forward (3) back view
(4) bent at the waist peering through an invisible low window, head at human height.
Eyes flat white, no glow. Uncanny, not gory.

STYLE: retro pixel art, large uniform square pixels, hard edges, no anti-aliasing,
1-pixel near-black outline #14151b, top-left two-tone shading.
BACKGROUND: flat solid magenta #FF00FF. No magenta/pink in the art.
DO NOT: glow, shadows, blood, text, labels, borders.
```

---

### M4: The Crawler (`M4-crawler`), a low, fast variant
Use: under-the-door / vent / ceiling beats. Side-view crawl cycle, 48×32 cells.

**Nano Banana** (16:9, attach `ref-cast.png`)
> In the style of the first image, create "the Crawler": a Changed person who moves on all fours like a spider-legged animal, grey round head held level and twisted to face the viewer, solid white eyes, wide smile, dark hoodie, thin limbs bent at sharp angles. Show a four-frame side-view crawling cycle moving to the right in one row, then below it a second row with three extra sprites: clinging upside-down to an invisible ceiling; squeezed flat with only the head and one hand visible as if under a door gap; frozen mid-step, head turned fully toward the viewer. Same pixel scale as the reference humans, so its body is about as long as a human is tall. Clear empty space between sprites, shared baseline per row (row two's ceiling pose aligns to the top instead). Uncanny, never gory. Flat white eyes with no glow. Crisp retro pixel art: large uniform square pixels, no anti-aliasing, 1-pixel near-black outline, top-left two-tone shading. Flat solid magenta (#FF00FF) background, no glow, no shadows, no text.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
New monster "the Crawler" in the attached reference's pixel style: a Changed person
moving on all fours like a spider-legged animal, grey round head twisted to face the
viewer, solid white eyes, wide smile, dark hoodie, thin sharply bent limbs. Body length
~ a human's height in the reference.

ROW 1: 4-frame side-view crawl cycle moving right (consistent frames, shared baseline).
ROW 2: (5) clinging upside-down to an invisible ceiling (align to top)
(6) flattened, only head and one hand visible as if under a door gap
(7) frozen mid-step, head fully turned to the viewer.
Clear magenta space between sprites. Eyes flat white, no glow. Not gory.

STYLE: retro pixel art, large uniform square pixels, hard edges, no anti-aliasing,
1-pixel near-black outline #14151b, top-left two-tone shading.
BACKGROUND: flat solid magenta #FF00FF. No magenta/pink in the art.
DO NOT: glow, shadows, blood, text, labels, borders.
```

---

### M5: Distant crowd (`M5-crowd-distant`)
Use: wide establishing shots (whole streets, hills, the town). Tiny figures, ~10×18.

**Nano Banana** (16:9, attach `ref-cast.png`)
> In the pixel style of the first image, draw sixteen tiny distant versions of the Changed, each only about one third the height of the reference figures. Make them simple silhouettes in dark muted hoodies (olive, maroon, navy, teal, plum, brown) with grey round heads and two white single-pixel eyes. Arrange them in two rows of eight with clear space between, all on shared baselines: a mix of standing still facing the viewer, seen from behind (no eyes), turned sideways, one tilting its head, one sitting, one on all fours, and one child-sized. Crisp low-resolution pixel art, uniform square pixels, no anti-aliasing, dark 1-pixel outline. Flat solid magenta (#FF00FF) background, no glow, no shadows, no text.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
16 tiny distant "Changed" figures, each ~1/3 the height of the attached reference
figures, in the same pixel style. Simple silhouettes: grey round heads, two
single-pixel white eyes, dark muted hoodies (olive, maroon, navy, teal, plum, brown).
LAYOUT: 2 rows x 8, clear magenta space, shared baseline per row.
MIX: standing facing viewer, back view (no eyes), side view, head tilted, sitting,
on all fours, one child-sized.
STYLE: low-res pixel art, uniform square pixels, no anti-aliasing, 1-pixel dark outline.
BACKGROUND: flat solid magenta #FF00FF. DO NOT: glow, shadows, text, borders.
```

---

### M6: Close-up busts (`M6-busts`), for insert shots
Use: the scare inserts (the face at the window, the smile, the peephole). 64×64 each.

**Nano Banana** (16:9, attach `ref-cast.png`)
> Using the first image's characters as the design reference but drawn much larger (each head about four times bigger, still chunky pixel art with clearly visible square pixels), create three close-up busts in one row with clear space between them. First: a Changed face and two flat palms pressed against glass, the cheeks and nose slightly squashed flat, white eyes, too-wide smile. Second: an extreme close-up of a Changed face, slightly tilted, the white eyes and stretched smile filling most of the frame. Third: the hero (cream head) seen from the shoulders up, frozen in terror with tiny pupils and a small open mouth, one hand over the mouth. Keep the same simple graphic face language as the reference (no realistic anatomy, no teeth detail, no gore). Eyes are flat white pixels, no glow. Hard edges, no anti-aliasing, no blur, 1-pixel near-black outline, two-tone shading from the top-left. Flat solid magenta (#FF00FF) background, no text.

**ChatGPT** (1536×1024, attach `ref-cast.png`)
```
3 close-up busts in the attached reference's design language, drawn ~4x larger but
still chunky pixel art with clearly visible square pixels. One row, clear magenta space.
(1) a Changed face + both palms pressed against glass, cheeks/nose squashed, white
eyes, too-wide smile.
(2) extreme close-up of a Changed face, slightly tilted, white eyes and stretched
smile filling the frame.
(3) the hero (cream head) shoulders-up, frozen in terror, tiny pupils, small open
mouth, one hand over the mouth.
Keep the simple graphic faces (no realistic anatomy, no teeth detail, no gore).
Eyes flat white, no glow.
STYLE: hard edges, no anti-aliasing, no blur, 1-pixel near-black outline #14151b,
top-left two-tone shading.
BACKGROUND: flat solid magenta #FF00FF. DO NOT: glow, text, borders, shadows.
```

---

## 5. Environments (9:16 plates, 135 × 240 logical)

Shared notes:
- Nano Banana aspect **9:16**. ChatGPT **1024×1536**; keep the important content inside the central 85% width (we crop to 9:16).
- **Lights OFF and unlit**: windows are flat dark colours (or flat moon-blue glass), lamps/screens/streetlights drawn switched off. We add every light in code.
- **No characters.** Leave the floor or ground band in the lower third clear and flat so actors can stand there.
- Then generate the **foreground occluders** for each plate (see the follow-up after E1).

### E1: Living room (`E1-livingroom`)
**Nano Banana** (9:16, attach `ref-sets.png`)
> Using the attached image as the exact style reference (these are our existing night-time pixel-art rooms), draw a new vertical 9:16 scene of a small suburban living room at night with the power out, in the same flat low-resolution pixel art with large uniform square pixels, dithered gradients, hard edges and the same navy, slate and dark wood palette. Front-on view like the reference rooms. A large front window on the left with half-open curtains and moon-blue glass. A boxy TV switched off (dark screen) on a low cabinet against the back wall. A floor lamp switched off. A worn couch facing the TV, seen from behind at the bottom of the frame, and a doorway to a dark hall on the right. The bottom third of the floor is open and clear so characters can stand there. No people, no glowing lights, no light beams, no lamps turned on, no text, no picture contents with writing. Keep the important furniture away from the far left and right edges. Calm, empty and slightly too quiet.

**ChatGPT** (1024×1536, attach `ref-sets.png`)
```
New background plate in the exact pixel style of the attached night-time rooms.
SCENE: small suburban living room at night, power out. Front-on view like the
reference. Large front window (left) with half-open curtains and flat moon-blue glass;
boxy TV switched off (dark screen) on a low cabinet; floor lamp switched off; worn
couch seen from behind at the bottom; dark doorway to a hall on the right.
COMPOSITION: portrait. Keep key furniture inside the central 85% width. Bottom third:
open, clear floor for actors. No people.
STYLE: flat low-resolution pixel art (~135 px wide logical), large uniform square
pixels, ordered-dither gradients only, hard edges, no anti-aliasing, palette of navy
#121829 / #151c31, slate, dark wood #3a2a24, moon glass #3d5688.
DO NOT: lights turned on, glow, light rays, bloom, people, text, logos, frames, borders.
```

**Foreground occluder follow-up (both):** "From this exact scene, draw ONLY the couch back (and any object nearest the camera) as separate sprites on a flat solid magenta (#FF00FF) background, same scale and pixels, nothing else." Ask for the same on every plate: the shelf edge (E2), the pump island (E4), the shelf ends (E5), the dashboard (E6).

### E2: Basement shelter (`E2-basement`)
**NB** (9:16, `ref-sets.png`)
> In the exact pixel style of the attached rooms, draw a vertical 9:16 night scene of an unfinished basement used as a hiding place: concrete walls with dithered texture, a wooden staircase coming down on the right with the door at the top closed, metal storage shelves on the left half-stocked with cans and boxes (simple pixel shapes, no labels), a water heater, a single tiny high window near the ceiling with flat moon-blue glass, a mattress on the floor with a blanket, and a bare ceiling bulb switched off. The lower third of the floor is clear. No people, no lights on, no glow, no light rays, no text. Important objects stay away from the far left and right edges.

**GPT** (1024×1536, `ref-sets.png`)
```
New plate in the attached pixel style. SCENE: unfinished basement used as a shelter at
night: dithered concrete walls, wooden stairs on the right up to a closed door, metal
shelves on the left half-stocked with cans/boxes (no labels), water heater, one tiny
high window with flat moon-blue glass, mattress + blanket on the floor, bare ceiling
bulb switched off.
COMPOSITION: portrait, key objects in the central 85% width, bottom third clear floor,
no people.
STYLE: flat low-res pixel art (~135 px wide logical), uniform square pixels, dither
only, hard edges, kit palette (navy, slate, dark wood, cold concrete grey).
DO NOT: lights on, glow, rays, people, text, labels, borders.
```

### E3: Street, wide (`E3-street-wide`)
**NB** (9:16, `ref-sets.png`)
> In the exact pixel style of the attached scenes, draw a vertical 9:16 wide view of a quiet suburban street at night during a blackout, seen from the middle of the road at human eye level: a row of three small houses on the far side with dark windows, power lines across a star-dotted navy sky, dead streetlights (bulbs off), two parked cars with dark windows, hedges and mailboxes, a sidewalk, and the road taking up the lower third, flat and empty so a crowd of characters can stand on it. Distant trees as dark silhouettes. No people, no lights on, no glow, no headlight beams, no text on mailboxes or signs.

**GPT** (1024×1536, `ref-sets.png`)
```
New plate in the attached pixel style. SCENE: suburban street at night during a
blackout, viewed from the middle of the road at eye level: 3 small houses on the far
side with dark windows, power lines across a starry navy sky, dead streetlights,
2 parked cars with dark windows, hedges, mailboxes, sidewalk; dark tree silhouettes.
COMPOSITION: portrait; lower third = flat empty road for a crowd of actors; key
elements in the central 85% width; no people.
STYLE: flat low-res pixel art (~135 px wide logical), uniform square pixels, dither
only, hard edges, kit palette (navy sky #070a14→#18233b, siding #2b2d3b, lawn #16241c).
DO NOT: lights on, glow, headlight beams, people, text, signs with writing, borders.
```

### E4: Gas station (`E4-gas-station`)
**NB** (9:16, `ref-sets.png`)
> Same exact pixel style as the attached scenes: a vertical 9:16 night view of a small roadside gas station during a blackout. A flat canopy over two fuel pumps with the canopy lights switched off, a tiny convenience store behind with dark glass windows and a closed door, an ice chest and a propane cage, a road sign pole with a blank board, and an empty asphalt forecourt in the lower third. Moonlit navy sky. No people, no brand names, no letters or numbers anywhere, no lights on, no glow.

**GPT** (1024×1536, `ref-sets.png`)
```
New plate in the attached pixel style. SCENE: small roadside gas station at night,
blackout. Flat canopy over 2 fuel pumps (canopy lights off), small convenience store
with dark glass and closed door, ice chest, propane cage, sign pole with a BLANK board.
COMPOSITION: portrait; lower third = empty forecourt; key elements in the central 85%;
no people.
STYLE: flat low-res pixel art (~135 px wide), uniform square pixels, dither only,
hard edges, kit night palette.
DO NOT: brand names, letters, numbers, lights on, glow, people, borders.
```

### E5: Supermarket aisle (`E5-aisle`)
**NB** (9:16, `ref-sets.png`)
> In the attached pixel style, draw a vertical 9:16 view straight down a dark supermarket aisle during a blackout, one-point perspective, with tall shelves on both sides holding simple pixel boxes, cans and bottles (no labels or text), a few items knocked onto the floor, dead ceiling light panels, and at the far end a dark doorway. The aisle floor in the lower third is clear. No people, no lights on, no glow, no signs with writing.

**GPT** (1024×1536, `ref-sets.png`)
```
New plate in the attached pixel style. SCENE: looking straight down a dark supermarket
aisle at night, one-point perspective; tall shelves both sides with simple boxes, cans,
bottles (no labels); a few items fallen on the floor; dead ceiling light panels; dark
doorway at the far end.
COMPOSITION: portrait; lower third = clear aisle floor; no people.
STYLE: flat low-res pixel art (~135 px wide), uniform square pixels, dither only,
hard edges, kit palette.
DO NOT: text, labels, price tags, lights on, glow, people, borders.
```

### E6: Car interior POV (`E6-car-pov`)
**NB** (9:16, `ref-sets.png`)
> In the attached pixel style, draw a vertical 9:16 first-person view from a car's driver seat at night with the engine off: the dark dashboard and steering wheel fill the bottom third, and through the windshield a dark two-lane road leads into a forest, with the rear-view mirror at the top centre showing only darkness. The windshield is flat dark navy glass with a few dithered reflections. The dashboard screens and gauges are off, with no numbers. No people, no headlight beams, no glow, no text.

**GPT** (1024×1536, `ref-sets.png`)
```
New plate in the attached pixel style. SCENE: first-person view from a car's driver
seat at night, engine off. Dark dashboard + steering wheel fill the bottom third;
through the windshield a dark two-lane road into a forest; rear-view mirror top centre
showing darkness; dashboard screens/gauges OFF, no numbers.
COMPOSITION: portrait, key elements in the central 85% width, no people.
STYLE: flat low-res pixel art (~135 px wide), uniform square pixels, dither only,
hard edges, kit palette.
DO NOT: headlight beams, glow, numbers, text, logos, people, borders.
```

### E7: Town from the hill (`E7-town-overview`)
**NB** (9:16, `ref-sets.png`)
> In the attached pixel style, draw a vertical 9:16 night view from a hilltop looking down over a small town during a total blackout: rooftops, a water tower, a church steeple and power lines as layered dark silhouettes, every window dark, a big pale moon low in a dithered navy sky, and a grassy hill edge in the lower quarter where characters can stand. No people, no lights on in the town, no glow, no text.

**GPT** (1024×1536, `ref-sets.png`)
```
New plate in the attached pixel style. SCENE: hilltop view over a small town at night,
total blackout: layered dark silhouettes of rooftops, a water tower, a church steeple,
power lines; every window dark; big pale moon low in a dithered navy sky.
COMPOSITION: portrait; lower quarter = grassy hill edge for actors; no people.
STYLE: flat low-res pixel art (~135 px wide), uniform square pixels, dither only,
hard edges, kit palette.
DO NOT: lit windows, glow, light rays, text, people, borders.
```

---

## 6. Props, light sources, icons

### P1: Survival supplies (`P1-supplies`), small props, 16×20 logical
**NB** (16:9, attach `ref-props-small.png` + `ref-cast.png`)
> Matching the attached small pixel-art props exactly in size, chunkiness and finish, and sized to the characters in the second image, draw a sprite sheet of 24 survival items in a 6 by 4 arrangement with clear empty space between them, each standing upright on a shared baseline per row: canned food, a big water jug, a pack of batteries, a hand-crank radio, a box of matches, a first-aid kit (plain red cross shape, no text), duct tape, a black trash bag, a crowbar, a walkie-talkie, a folded paper map, a door key on a ring, a small backpack, a sleeping bag roll, a can opener, a bag of rice, a box of crackers, a thermos, a whistle, a pocket knife closed, a roll of blackout cloth, a car key fob, painkiller pill bottle, and a notebook with a pencil. Simple readable shapes, 1-pixel near-black outline, two-tone shading from the top-left, muted colours with a few accents. No labels, letters or numbers on anything. Flat solid magenta (#FF00FF) background, no glow, no shadows.

**GPT** (1536×1024, attach `ref-props-small.png`, `ref-cast.png`)
```
Sprite sheet of 24 small survival props, matching the attached small props exactly in
size, chunkiness and finish, and scaled to the attached characters.
LAYOUT: 6 x 4, clear magenta space, upright, shared baseline per row.
ITEMS: canned food, water jug, battery pack, hand-crank radio, matchbox, first-aid kit
(plain red cross, no text), duct tape, black trash bag, crowbar, walkie-talkie, folded
map, door key on ring, small backpack, sleeping-bag roll, can opener, bag of rice,
box of crackers, thermos, whistle, closed pocket knife, roll of blackout cloth, car key
fob, pill bottle, notebook + pencil.
STYLE: pixel art, uniform square pixels, hard edges, no anti-aliasing, 1-pixel outline
#14151b, top-left two-tone shading, muted colours.
BACKGROUND: flat solid magenta #FF00FF. DO NOT: labels, letters, numbers, glow, shadows.
```

### P2: Light sources, OFF and ON pairs (`P2-lights`)
The ON state is just brighter flat pixels on the bulb/screen. **No halo**; we add the glow.

**NB** (16:9, attach `ref-props-large.png`)
> In the exact pixel style of the attached lamp and door, draw eight light-source props, each twice: switched OFF in the top row and switched ON in the bottom row directly below its OFF version, identical shapes and positions so only the bulb or screen colours change. The props are a camping lantern, a flashlight standing on its end, a single candle, a bedside lamp, an old boxy TV, a laptop opened, a string of fairy lights hanging in a loose curve, and a car headlight unit. In the ON row the light-emitting part is filled with bright flat warm or cool pixels (TV/laptop cool blue-white, others warm yellow), but there is absolutely no glow, halo, rays or light spilling outside the object. No text on any screen. Flat solid magenta (#FF00FF) background, 1-pixel near-black outline, hard edges, no anti-aliasing.

**GPT** (1536×1024, attach `ref-props-large.png`)
```
8 light-source props in the attached pixel style, each drawn twice:
ROW 1 = switched OFF, ROW 2 = the same prop switched ON, directly below, identical
shape/position (only the bulb/screen colour changes).
PROPS: camping lantern, flashlight standing on end, single candle, bedside lamp, old
boxy TV, open laptop, string of fairy lights in a loose curve, car headlight unit.
ON state: emitting area = bright flat pixels (screens cool blue-white, others warm
yellow). Absolutely NO glow, halo, rays, or light outside the object.
STYLE: pixel art, uniform square pixels, hard edges, no anti-aliasing, 1-pixel outline
#14151b. BACKGROUND: flat solid magenta #FF00FF. DO NOT: text on screens, glow, shadows.
```

### P3: Doors, windows and barricades (`P3-openings`), large props, ≤64×140
**NB** (16:9, attach `ref-props-large.png` + `ref-cast.png`)
> In the exact style and scale of the attached door (the characters in the second image show human size: doors are about twice a character's height), draw eight large props in one or two rows with clear space between them, each standing on a shared baseline: a front door with a small window, the same door boarded over with three nailed planks, a window with blinds fully down, the same window with blinds half up and moon-blue glass, a window covered by taped black trash bags, a wooden chair wedged under a door handle (chair only), a tall bookcase pushed in front of a doorway, and a door with a round peephole and a chain lock. Glass is flat moon-blue or dark, never lit. 1-pixel near-black outline, two-tone shading from the top-left, no anti-aliasing. Flat solid magenta (#FF00FF) background, no glow, no text.

**GPT** (1536×1024, attach `ref-props-large.png`, `ref-cast.png`)
```
8 large props in the attached door's exact style and scale (doors ~2x a character's
height; characters attached for scale). Clear magenta space, shared baseline.
(1) front door with small window (2) same door boarded with 3 nailed planks
(3) window, blinds fully down (4) same window, blinds half up, moon-blue glass
(5) window covered with taped black trash bags (6) wooden chair (to wedge under a door
handle) (7) tall bookcase (to block a doorway) (8) door with round peephole + chain lock.
Glass flat moon-blue or dark, never lit.
STYLE: pixel art, uniform square pixels, hard edges, no anti-aliasing, 1-pixel outline
#14151b, top-left two-tone shading. BACKGROUND: flat solid magenta #FF00FF.
DO NOT: glow, text, shadows, borders.
```

### P4: HUD inventory icons (`P4-icons`), 16×16
**NB** (1:1, attach `ref-palette.png`)
> Draw sixteen tiny 16-by-16-pixel icons for a horror game's inventory HUD in a 4 by 4 arrangement with generous empty space between them, using only colours from the attached palette plus pure white: water bottle, cereal box, battery, flashlight, candle, phone, signal bars crossed out, lightbulb crossed out, door locked, eye, moon, clock, first-aid cross, key, footprints, and a warning triangle. Each icon is a bold readable silhouette with a 1-pixel near-black outline, perfectly crisp, no anti-aliasing, with large clearly visible square pixels. Flat solid magenta (#FF00FF) background, no glow, no text.

**GPT** (1024×1024, attach `ref-palette.png`)
```
16 tiny 16x16-pixel inventory icons for a horror HUD, 4 x 4 with generous magenta
space. Colours only from the attached palette + pure white.
ICONS: water bottle, cereal box, battery, flashlight, candle, phone, signal bars crossed
out, lightbulb crossed out, locked door, eye, moon, clock, first-aid cross, key,
footprints, warning triangle.
STYLE: bold readable silhouettes, 1-pixel outline #14151b, crisp, no anti-aliasing,
large clearly visible square pixels. BACKGROUND: flat solid magenta #FF00FF.
DO NOT: glow, text, letters, numbers, borders.
```

---

## 7. Accept / reject checklist (before dropping a file in `incoming/`)

- [ ] Background is one flat magenta (no gradient, vignette or checkerboard) and there's no magenta inside the art.
- [ ] Pixels look like uniform square blocks when zoomed in (no smeared edges or mixed pixel sizes inside one sprite).
- [ ] Every sprite is separated by background; none touch or overlap.
- [ ] Same scale across the sheet and versus the reference (heads ≈ the same size as in `ref-cast.png`).
- [ ] No glow, rays, halos or ground shadows; monster eyes are plain white.
- [ ] No text, numbers, logos or invented labels.
- [ ] Environments: no people, lights off, clear floor band, nothing vital in the outer edges.

Common fixes to send as a follow-up in the same chat:
- "Make the pixels larger and more uniform; reduce the resolution so each pixel block is clearly visible."
- "Remove all glow and soft shading; use flat two-tone colours only."
- "The background must be one single flat #FF00FF colour with nothing else."
- "Keep the character identical but [change]; do not redesign them."
- "Move the sprites apart so none of them touch."

Sources consulted for model-specific behaviour (third-party, not official docs):
- Nano Banana sprite sheets: https://lab.rosebud.ai/blog/how-to-create-a-sprite-sheet-with-ai-using-google-gemini-and-nano-banana-easy-guide
- Nano Banana prompting style: https://artlist.io/blog/nano-banana-prompts/
- GPT image transparency: https://docs.apiyi.com/en/live/2026-08/gpt-image-2-transparent-background
- Sprite prompting / flat backgrounds: https://forgegui.com/blog/ai-sprite-generator-png-import-mastering-game-assets
