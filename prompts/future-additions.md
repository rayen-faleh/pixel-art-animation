# Future asset additions (currently drawn in code)

These were made in code (`kit/sets_nightshift.py`, `src/film/NightShift.tsx`, `src/film/ns-ui.tsx`)
for NIGHT SHIFT Part 1. They work, but ChatGPT versions would match the generated kit's
richer finish. Same rules as `asset-prompts.md`: attach `prompts/refs/ref-cast.png`
(+ `ref-sets.png` for plates), flat magenta #FF00FF, no glow, no text unless stated.

| Asset | Now | Why upgrade |
|---|---|---|
| Store interior plate (glass storefront, door, ice machine, snack shelf, tube lights) | `store_bg.png`, code | Hand-coded and fairly flat next to the AI plates |
| Counter (foreground) | `store_fg.png`, code | Same |
| Register, CCTV monitor, walkie-talkie, OPEN sign on/off, pump nozzle | `ns_props`, code | Simple shapes |
| Roller shutter (rolling + jammed) | CSS slats in `NightShift.tsx` | A pixel sheet with 7 heights + a dented "hit" frame would look better |
| Driver crouching / lying / sliding | `driver.front` lowered behind the counter; `driver.34l` rotated for the dive | Needs real poses |
| Hero hand-over-someone's-mouth pose | `reach.scared` | The action is only implied |
| CCTV overlay, NOISE meter | UI components | Fine as code; listed for completeness |

## Prompts (ChatGPT)

### Store interior plate (1024×1536)
```
New background plate in the attached pixel style. SCENE: inside a small 24-hour gas
station store at night, front-on view: the back wall is a glass storefront with a glass
door on the right half (dark forecourt and two fuel pumps visible outside), a metal roller-
shutter housing above the glass, a snack shelf and an ice machine on the left, two
fluorescent tube fixtures on the ceiling (switched OFF), tiled floor.
COMPOSITION: portrait; bottom third = clear floor; key elements in the central 85% width;
no people; leave the lower 15% of the glass visible (a shutter will cover the rest).
STYLE: flat low-res pixel art (~135 px wide logical), uniform square pixels, dither only,
hard edges, kit night palette.
DO NOT: lights on, glow, readable text or brand names, people, borders.
```

### Counter + counter props (1536×1024)
```
Sprite sheet in the attached pixel style, scaled to the attached characters: (1) a shop
counter seen from the front, waist height for these characters, long enough for two of
them to hide behind (2) cash register (3) small CCTV monitor with a dark screen
(4) walkie-talkie standing upright (5) hanging OPEN sign switched OFF (6) the same sign
switched ON (bright red letters, no glow) (7) a fuel nozzle dangling from its hose.
LAYOUT: one or two rows, clear magenta space, shared baseline.
STYLE: chunky pixel art, hard edges, no anti-aliasing, 1-pixel outline #14151b.
BACKGROUND: flat solid magenta #FF00FF. DO NOT: glow, extra text, shadows, borders.
```

### Roller shutter states (1536×1024)
```
Sprite sheet in the attached pixel style: a metal roller shutter for a shop front
(horizontal ribbed slats, bottom bar, grey steel), drawn 7 times at the same width with
increasing height from barely out of its housing to almost fully closed, plus an 8th:
fully lowered but jammed with a small gap at the bottom and a dent in the middle as if
something hit it from outside.
LAYOUT: one row, tops aligned, clear magenta space.
STYLE: chunky pixel art, hard edges, no anti-aliasing, 1-pixel outline #14151b.
BACKGROUND: flat solid magenta #FF00FF. DO NOT: glow, text, graffiti, borders.
```

### Delivery driver extra poses (1536×1024)
```
Redraw the delivery driver (dark cap, padded navy vest, light-blue sleeves) from the
first image in 6 new poses, same scale and style: (1) crouching low (2) sitting on the
floor, back against a wall, knees up, panting (3) diving forward, horizontal, arms first
(4) lying flat on the stomach (5) holding up a car key fob in one hand, scared
(6) a hand clamped over his mouth by someone off-frame (only his face and that hand).
LAYOUT: 2 rows x 3, clear magenta space, shared baseline per row.
STYLE: chunky pixel art, hard edges, no anti-aliasing, 1-pixel outline #14151b.
BACKGROUND: flat solid magenta #FF00FF. DO NOT: glow, shadows, text, borders.
```

## SOUL FOR SALE Part 1 (code-drawn, `kit/sets_soul.py`)

| Asset | Now | Why upgrade |
|---|---|---|
| Supermarket checkout (aisle-6 shelving + counter with belt and register) | `market_bg/fg.png` | Flat next to the AI plates; a GPT plate would add depth |
| Envelope (cream / black), steak tray, cash stack, badge, alarm clock, box, can | `soul_props` | Simple shapes |
| Manager, coworker, four strangers holding receipts, black-uniform versions of the hero and strangers | `characters.py` variants | Fine for the kit look; GPT versions could add a store vest and real uniform details |
| Hero lying in bed seen from the foot end | front sprite tucked under a blanket rect | A real lying-down pose |

## AFTER HOURS Day 1 (code-drawn, `kit/sets_school.py`)

| Asset | Now | Why upgrade |
|---|---|---|
| School library (windows at dusk, bookshelf, study table + laptop) | `library_bg/fg.png` | Flat next to the AI plates; a GPT plate would add depth and clutter |
| One-point school hallway (lockers, classroom doors, ceiling panels, EXIT doors) | `hall_bg.png` | Procedural perspective; a GPT plate could add posters, trophy case, wear |
| Library door from inside (wired-glass window, PA speaker, book-return cart) | `door_bg/fg.png` | Simple shapes |
| Staff parking lot at night (reserved PRINCIPAL sign, streetlight, two cars) | `parking_bg.png` | Simple shapes |
| Tall infected figure (stand / tilt / face / face_open) | `infected.png` 32x64 | Needs a proper creepy design pass and a head-turn in-between |
| Janitor, janitor's cart, keys | `characters.py` variant + `school_props` | A cap / tool belt would read "janitor" faster |
| Hero crouching | front sprite slid down behind the cart | A real crouch pose |

## NIGHT ROAD (long form, 16:9, code-drawn, `kit/sets_nightroad.py`)

| Asset | Now | Why upgrade |
|---|---|---|
| Car interior from the back seat (headliner + dome light, windshield, wheel, dash, radio, seat backs) | `nr_cab_bg/fg.png` | The main set of the film; a GPT plate would add upholstery, wear and real depth |
| Route 9 forward view (fields, tree line, road to the vanishing point) and side view | `nr_road.png`, `nr_side_*.png` | Procedural; a plate could add fences, ditches, a farmhouse light far off |
| Gas station canopy, pumps, store | `nr_gas_bg/fg.png` | Simple shapes |
| Dad's house porch at 2 AM | `nr_porch_bg.png` | Simple shapes |
| Inserts: Dad's card, torn strip, dome light + switch, radio, mirror | `nr_card`, `nr_strip`, `nr_dome`, `nr_radio`, `nr_mirror*` | The card's 3x5 "handwriting" is legible but not handwritten; a GPT plate of a real pencil card would sell it |
| Gray sedan (side / doors open lit / rear / rear lit / ours with one taillight out) | `sedan.png` 96x36 | Fine for the kit; GPT could add a proper 3/4 view |
| The figures (pale shirt, arms at sides) | `pale.png` 16x46 | Needs a proper creepy design pass and a crouch for the roof |
| Dad (older head, grey hair, glasses, brown jacket) | `dad` atlas built from `characters.py` | A GPT pass could add a cardigan / robe for the porch |
| Hands (reach, flat, thumb), visor, phone face up/down | `nr_props.png` | Hands are tiny and scaled 2x; a GPT hand set at insert scale would look better |
| Hero from behind in the driver's seat | `turn0` back view | Reads as a bald head; a back view with hair and a hood would help |

## DON'T REPLY Day 1 (code-drawn)

| Asset | Now | Why upgrade |
|---|---|---|
| Little brother | `brother` atlas (hero rig, teal hoodie) drawn at 0.78x | A real kid design (smaller head/body proportions) instead of a scaled hero |
| Bedroom door opening onto a lit hallway | two rects in `DontReply.tsx` | A proper door prop with a swing in-between |
| Blinds we look through | slat divs over the LIGHTS OUT street | A blinds fg layer with a bent slat |
| The tall thing holding a phone | `infected` + a lit pixel | A version actually holding the phone up to its face |
| Hands/thumbs on phone and tablet | CSS rounded rects | Pixel hand sprites at insert scale |

## AFTER HOURS Day 2 (code-drawn)

| Asset | Now | Why upgrade |
|---|---|---|
| Wall intercom speaker with red LED | divs in `AfterHours2.tsx` | A pixel prop with a visible grille at close-up scale |
| Front-office intercom board, librarian's desk phone + taped code | CSS panels | Pixel inserts would match the world better |
| Hero hiding under the desk | `hero_actions` crouch / tiptoe | A crawl-under in-between and a hand-over-mouth pose |

## NIGHT SHIFT Part 2 (code-drawn)

| Asset | Now | Why upgrade |
|---|---|---|
| Beer cooler (3 glass doors, cans, compressor grille, plug behind it) | divs in `NightShift2.tsx` | A pixel set layer that matches the store plate |
| Dev mouthing "battery's dying" / taking off his shoes | the `driver` sprite front/3-4 frames | A mouth-shape frame and a crouch/shoe pose |
| Crawler hands under the shutter | the Part 1 `under_door` frame repeated | A real hand sprite with fingers splayed on the tiles |

## KEEP PRETENDING (long form, 16:9)

Placeholder cast and sets are drawn in code (`kit/cast_pepper.py`, `kit/sets_keep.py`). The full ChatGPT replacement
pack (Pepper the cat incl. the upright poses, busts, props, five 16:9 sets) is already written in
`prompts/keep-pretending-prompts.md`, with labelled pose guides in `prompts/refs/ref-pepper-*.png`. Ingest with
`python3.12 kit/ingest.py kit/ingest_kp.json`.
