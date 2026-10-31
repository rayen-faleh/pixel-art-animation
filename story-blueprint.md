# Horror short blueprint (second person + series)

Read this before writing the brief for any new short. It sits on top of the Pixel Dread
style skill: that skill decides how things look and move, this file decides what the story
does and how it sounds.

Built from frame-by-frame and audio breakdowns of two references, plus what we learned making LIGHTS OUT,
NIGHT SHIFT, SOUL FOR SALE, AFTER HOURS, NIGHT ROAD and DON'T REPLY:

- **Reference 1** ("DEAD QUIET, Day 1", 73 s, 2.1M views in a few days; `Video-46130.mp4`): sections 1–2.
- **Reference 2** ("THE LIGHTHOUSE, Day 2", Instagram, 130 s, 1.5M views, 85K+ likes; `incoming/ref2/ref2.mp4`):
  section 4, with the Reels ranking signals and the gap list. **Read section 4 first: it updates
  the hook, the pacing and the ending rules below.**

The references are for studying structure only. Never reuse their premises, titles, rules or alert text.

---

## 1. What the reference actually does

### Timeline (measured from transcript word times and 1 fps frames)

| Time | Beat | Narration | Picture |
|---|---|---|---|
| 0.0–5.6 | Hook | "You're buying groceries at 2 a.m. and every phone in the store starts screaming at once." | Shopper in an aisle → checkout line, everyone holding a lit phone |
| 2.3 | Title | none | "DEAD QUIET / DAY 1 / 2:47 AM" over the checkout shot, then gone |
| 6.6–11.3 | Rule of the threat | "Emergency alert. Stay silent. They cannot see, but they can hear." | POV: your hand holding the phone, alert text builds line by line |
| 12.1–16.9 | World shuts off | "Then the lights die. First the store, then every streetlight outside." | Aisle 9 goes dark; parking lot in fog, lamps die |
| 17.6–21.0 | Silence | "The fridges go quiet. You can hear yourself breathe." | Fridge doors; hero close-up, mouth open. **The music cuts out completely here.** |
| 21.9–28.8 | Rule #1 | "Rule number one. Turn your phone off. Not silent, off." | Rule card + POV phone, slide-to-power-off |
| 29.4–33 | Offscreen proof | "Far down the highway, a car alarm wails. Then it stops, mid-sound." | Headlights through the door glass, then dark |
| 33–36.9 | New noise source | "Your cart has a squeaky wheel." | Close-up of the wheel |
| 37.5–40 | Rule #2 | "Rule number two. Let go of the cart." | Card + your hand on the red cart handle |
| 40–47 | Someone breaks it | "The security guard pries at the stuck automatic doors. Metal screeches." | Guard pushing the doors; NOISE meter spikes into red |
| 44–51.4 | Threat reveal (65% in) | "Outside, under a dark streetlight, something tall tilts its head, listening." | Tall, pale, thin figure through the glass, head tilts on "tilts" |
| 52.1–57.8 | Near miss | "You back into aisle nine and bump a shelf. A can tips. You catch it an inch from the floor." | Can tipping; your hand catches it |
| 57.8–62 | Rule #3 | "Rule number three. Don't touch the shelves." | Card ("ONE FALL IS ENOUGH.") over the hero frozen in the aisle |
| 62–68 | Dilemma | "At the end of the aisle, a woman with a stroller. Her baby is waking up. His lips start shaking." | Woman far down the aisle; baby close-up, eyes shut, lip trembling |
| 68–70 | Question | "What do you do? Comment below." | "THE BABY IS ABOUT TO CRY", two pills: HELP HER CALM IT / WALK AWAY FAST |
| 70.5–73.3 | End card | none | "DEAD QUIET / DAY 1 / 2:58 AM" + "FOLLOW FOR PART 2" |

### Story mechanics worth copying

1. **The whole premise lands in 11 seconds.** Ordinary place and time, something everyone shares
   (every phone at once), then the threat's rule in three short sentences. By second 11 the
   viewer knows the danger and how it works.
2. **One rule of the threat, which the senses can follow.** "They can hear." Everything after
   that is about sound, so every object on screen becomes a possible threat: phone, cart wheel,
   doors, a can, a baby.
3. **Each numbered rule comes right after a noise source is shown.** The pattern is
   *object → it could make a sound → RULE #n*. The viewer works the rule out a second before
   the card says it, and that feels good.
4. **Proof happens offscreen and by sound.** A car alarm stops mid-wail. No blood, no body. The
   viewer fills it in.
5. **The threat is shown late and only in part:** about 65% of the way through, through glass,
   one small movement (a head tilt) on the word that names it.
6. **Near-misses between rules.** The can is caught an inch from the floor. Tension, without
   spending the threat.
7. **The ending is a moral choice that involves someone innocent,** not a puzzle. Calm the baby
   (risk yourself) or walk away (abandon them). Neither answer is obviously right, so people argue
   in the comments.
8. **Time runs nearly in real time:** 2:47 → 2:58 AM, eleven minutes. Time skips are minutes, not days.
9. **It ends on a cliffhanger as part of a series:** "DAY 1" in the title, "FOLLOW FOR PART 2" on the end card.
   The end card copies the title card, so the loop back to frame 0 looks intentional.

### On-screen system

| Element | What it does | Our equivalent |
|---|---|---|
| HUD top-left | Red dot + "DAY 1", big clock "2:47 AM", "SAVEMORE 24/7 · NO POWER" status line | `Hud` series tag + status |
| HUD top-right | **NOISE meter**, segmented bar going green to yellow to red, reacting live to every sound in the story | Chips. We have no live meter yet (SOUL used a stepped % chip) |
| Rule cards | Red tag "RULE #1", huge white condensed title with a red underline, red subline giving the reason ("NOT SILENT. OFF.", "THE WHEELS SQUEAK.", "ONE FALL IS ENOUGH.") | None. Add a `RuleCard` |
| Captions | 1–3 words at a time, bold sans caps, white with **lime-yellow** keywords, mid-frame (~31% and ~81% height depending on the shot), never over faces | `WordCaption` (ours are 1 phrase, Anton, yellow/red) |
| Phone POV | Big cartoon hand holding a generic phone; alert text builds in sync with the narration | `Phone` / `AlertCard` |
| Choice | Bold question in white + red, two outlined pills (green = help, red = run), "COMMENT BELOW ↓" | `ChoiceStack` |
| End card | Series name, DAY n, clock, small red "FOLLOW FOR PART 2" pill on black | Add an `EndCard` |

### Picture

- About 20 shots in 73 s, **3.6 s per shot on average**, hard cuts. Inside a shot the camera holds or
  pushes in slowly.
- Shot types rotate: wide establishing → POV insert (phone, hand) → object close-up (wheel,
  can, fridge) → character reaction → threat reveal. Never two of the same type in a row
  unless it's a deliberate repeat.
- Lighting tells you the state of the world: flat grey store light before the outage; afterwards almost black,
  with only green EXIT glow, orange streetlight in fog, and headlights.
- The narration's literal nouns are drawn: say "fridges" and the shot is fridges, say "squeaky wheel"
  and the shot is a wheel. Literal and quick to read; this is what keeps it easy to follow.

### Sound (measured; I can't listen, so these are numbers, not impressions)

- Mix at **−14.1 LUFS** integrated, same target as ours.
- Narration about **144 wpm** (168 words in 70 s). SOUL FOR SALE ran at about 137.
- **A continuous music bed under the whole film.** In pauses between sentences the track sits only about
  **4.5 dB below the speech** (speech −15.8 dB RMS, pauses −20.3). Our SOUL mix: speech −17.1, pauses
  −28.8, a **12 dB** drop, so our pauses are nearly silent. This is the gap the user heard.
- The bed is a low drone: the strongest steady pitch is **41.2 Hz (E1)** with 61.7 Hz (B, the fifth),
  82.4 Hz and 123.5 Hz on top. Energy sits at 20–500 Hz, nothing above about 600 Hz except effects. There's no beat
  (no steady low pulse found), and it stays the same pitch for the whole film.
- **Store-hum layer:** 60/120 Hz mains hum fills the first 12 s, then disappears when the lights die. The
  power cut is heard as well as seen.
- **One full dropout:** at 18.7–19.2 s the entire track goes to near silence on "You can hear yourself breathe".
  It's the only silence in the film, which is why it hits.
- Effects heard in the spectrogram:
  - alert beeps around 1 kHz, two bursts
  - a rising sweep before the blackout
  - car alarm warbling 1.2–1.8 kHz
  - metal screech as falling chirps at 1.5–2.5 kHz on "screeches"
  - a thin high tone of about 1.5 kHz under the baby/choice section, a tension whine that builds to the end

---

## 2. The blueprint

### 2.1 Premise checklist (fill before the brief)

- [ ] **Ordinary place + exact time** a viewer has been in: store, bus, laundromat, office at night.
- [ ] **One sense-based rule** for the threat: they hear / they see eye contact / they follow light /
      they count. The rule has to turn ordinary objects into risks.
- [ ] **3 everyday objects** in that place, each one able to break the rule (these become rules
      #1–#3).
- [ ] **One innocent bystander** for the final dilemma, plus two choices that cost something.
- [ ] **One HUD meter** that measures the rule (NOISE, LIGHT, EYE CONTACT, HEAT…) and moves on screen.
- [ ] **Series name (1–2 words) + DAY n.** Plan Part 2's first line now.

If the premise needs a sentence starting with "because", it's too complicated. SOUL FOR SALE's
week montage needed a receipt ledger, a SOUL meter and a daily ritual before viewers could follow
it. The reference needs only "they can hear".

### 2.2 Beat sheet (60–75 s; scale proportionally up to 90 s)

| % of runtime | Seconds (at 72 s) | Beat | Rules |
|---|---|---|---|
| 0–8% | 0–6 | **Hook:** place, time, shared anomaly in ONE sentence | Starts with "You're…". Visual change in the first second. |
| 3% | ~2 | **Title card** over the hook shot, ~1.5 s | Series name + DAY n + clock |
| 8–16% | 6–12 | **The threat's rule** via an in-world message (alert, note, radio, PA) | Three sentences or fewer. Generic UI, never presented as a real alert service |
| 16–30% | 12–22 | **The world shuts off.** Lights, hum, crowd noise go. One hard silence | The bed drops out here, once |
| 30–42% | 22–30 | **RULE #1:** obvious object → card | The viewer should guess it first |
| 42–50% | 30–36 | **Offscreen proof** by sound, cut short | No gore, no body |
| 50–58% | 36–42 | **New noise source → RULE #2** | |
| 58–70% | 42–51 | **Someone else breaks a rule → threat revealed in part** | Through glass or a doorway, at a distance, one move on its verb |
| 70–82% | 51–60 | **Your own near-miss → RULE #3** | Caught "an inch from the floor" |
| 82–95% | 60–69 | **Innocent bystander about to break the rule** | Close-up of the small tell (lip shaking) |
| 95–100% | 69–72 | **"What do you do? Comment below."** + two pills | Pills = help / save yourself |
| +3 s | | **End card**, same as the title card + "FOLLOW FOR PART 2" | Lets the loop back to the start feel intentional |

### 2.3 Writing rules

- Second person, present tense. "You're…", "You back into…", "Your cart…".
- **One image per sentence, 3–10 words.** The longest sentence in the reference is 17 words (the hook).
- **Say the nouns you will draw.** If a sentence has no concrete noun the picture can't show it.
  "Fridges", "wheel", "can", "stroller". Not "the atmosphere changes".
- **Verbs that make a sound:** screaming, wails, squeak, screeches, tips. Each one gets a
  sound effect on that word.
- **Cut a sound mid-sentence for dread:** "Then it stops, mid-sound."
- **Name the rule, then the reason, in the card's two lines:** "TURN YOUR PHONE OFF / NOT SILENT. OFF."
  The red subline is the reason or the trap, 2–4 words.
- **No explaining the monster.** The reference never says what "they" are. A description of the monster
  is one image: "something tall tilts its head, listening".
- **End on a question, not a statement.** "What do you do?" beats "Your call." for comments; keep
  "Your call." only if the choice pills carry the question.
- Run the draft through `/human-voice-writing`: cut clichés ("the air was thick"), cut
  explanation after an image, vary sentence length.
- Target 140–150 wpm with our voice (Chatterbox, cfg 0.65). Count words before generating:
  72 s ≈ 165–175 words.

### 2.4 Shot rules

- Shot length 2–6 s, average ~3.5 s. One new image on every concrete noun.
- Rotate shot types: wide → POV hand/phone → object close-up → face reaction → threat.
- The camera stays mostly still; slow push-ins on dread lines, snap-zoom or a 2-frame flash on shocks.
- Show the threat only after 60% of the runtime, at a distance, through something (glass, a gap
  between shelves, a reflection, a security monitor).
- Lighting changes with the story: before the event = flat; after = near black with 1–2 coloured
  practical lights (EXIT green, sodium orange, phone blue).
- Keep captions off faces: move them to the top band on close-ups.

### 2.5 HUD rules

- Top left: `● DAY n` (red dot), big clock, location + state line ("SAVEMORE 24/7 · NO POWER").
  The state line changes when the world changes.
- Top right: **one live meter tied to the rule.** It moves on every in-story sound or action
  (the meter = the threat's sensor), spikes into red when someone breaks the rule, and falls
  back slowly. This replaces static chips as the main tension display.
- The clock advances in minutes on cuts that skip time.

### 2.6 Sound rules (the part we were missing)

Layers, bottom to top:

1. **Music bed: continuous, from frame 0 to the end card.** A low drone with one root note and its fifth (e.g. E1 41 Hz + B1 62 Hz
   + E2 82 Hz), slow beating/detune, filtered noise, nothing above ~600 Hz so it never
   competes with the voice. **No beat.** Level in pauses ≈ **4–6 dB below the speech level**
   (measure it: speech RMS vs pause RMS, as in §1).
2. **Room tone layer** that belongs to the place (store hum 60/120 Hz, fridge compressor, bus
   engine). It **cuts out** at the moment the world shuts off.
3. **One full dropout:** everything drops to silence for 0.4–0.8 s on the "you can hear yourself breathe" beat,
   once per film. Never twice.
4. **Effects on the sounding verbs:** alert tones, alarm, screech, squeak, knock, can tip. Synced to the word start.
5. **Tension whine** (thin high tone, ~1–2 kHz, very quiet) rising slowly under the final dilemma, cut
   on the end card.
6. Narration on top; final mix −14 LUFS, peak ≤ −1.5 dBFS.

Where the bed comes from:

- **Default: synthesise it in code** (`scripts/sfx_mix.py` `bed()`). No licence, no Content ID claims,
  same key every film, and it matches the rule that new assets are made in code. The current `bed()`
  is too thin and too quiet for this: 55 Hz sines at −22 dB plus the per-cue gains. Upgrade it to the
  spec above.
- **If you want a composed track instead:**
  - **YouTube Studio Audio Library:** safest for YouTube; check the licence column, as some
    tracks need a credit in the description, and use outside YouTube (TikTok, Reels) isn't
    guaranteed.
  - **Pixabay Music:** no credit needed, but some tracks are registered with Content ID and can get
    claimed later; save the licence page/.txt for each track so you can dispute a claim.
  - **Incompetech (Kevin MacLeod):** CC BY 4.0, a credit line is required in the description
    ("Track by Kevin MacLeod (incompetech.com), CC BY 4.0"), or buy the no-credit licence.
  - Whatever is used, record it in `assets.json` with the source URL, licence and credit text.

### 2.7 Endings and series

- Choice pills: one **help** option (green), one **save yourself** option (red). Both should feel
  wrong.
- "COMMENT BELOW ↓" under the pills, narrator asks "What do you do?"
- End card mirrors the title card + "FOLLOW FOR PART 2". Part 2 opens on the result of the most-commented
  choice.

---

## 3. Lessons from our own films

- **One engine per film.** Mixing two mechanisms (SOUL v1: receipt costs + vanishing coworkers)
  made the film hard to follow. One rule, made visible on screen in three ways (meter, cards, captions).
- **Repeat a ritual so viewers predict the next beat** (SOUL's daily receipt). The reference does
  the same with *object → rule card*.
- **Narrator:** user's own voice via Chatterbox (`audio/voices/user_ref.wav`), cfg 0.65, tempo
  1.05–1.08. Re-roll bad takes with a per-line `seed`.
- **New assets are drawn in code** and logged in `prompts/future-additions.md`; image prompts are
  written for ChatGPT only.
- We can't listen to audio here. Check the mix with numbers: LUFS, the speech vs pause gap, and
  transcription of every line.
- **Reel toolkit:** `src/film/reels-ui.tsx` holds the section 4 pieces (hook headline, beat chips, big counters,
  numbered choice, "your comments decide" end card). AFTER HOURS Day 2 and NIGHT SHIFT Part 2 use it; reuse it.
- **Sequels open on the vote:** say which option won in the first seconds ("You picked option one"), then show its
  cost. Put "PART/DAY 1 · ON MY PAGE" under the hook headline.
- **Narration pace:** tempo 1.0 for reels now (section 4: ~125 wpm target); 1.05–1.08 only for tight shorts.
- **Long form can end on a twist instead of a choice** (KEEP PRETENDING, `pretend-concept.md`): the rules were the
  trap, and the narrator was the threat all along. Plant deniable clues, change only the last line's voice, and end on
  a question aimed at the viewer ("Is your cat facing you right now?"). NIGHT ROAD's dome light turning on by itself
  works the same way.
- **Big mixes:** a long-form WAV can pass GitHub's 100 MB limit; ship the public mix as MP3 (KEEP PRETENDING).
- **Narration runs on CPU too** (`chatterbox_narrate.py` falls back to CPU with `--threads`), just slower.

---

## 4. Reference 2: what a Reel needs to get pushed ("THE LIGHTHOUSE, Day 2")

Second reference, from Instagram: 130 s, 720×1280, 1.5M views, 85K+ likes. The file is
`incoming/ref2/ref2.mp4`, with the transcript in `incoming/ref2/transcript.json` and 1 fps contact sheets in
`incoming/ref2/sheet*.png`. As with the first reference, study the structure and never reuse the premise.
Flat vector art, not pixel art, but the same genre: survival horror, a HUD clock, a moral choice at the end.

### 4.1 What Instagram ranks on

Adam Mosseri (head of Instagram) said in January 2025 that the three signals that matter most for Reels
are **watch time** (both the % watched and the seconds watched), **likes per reach** and **sends per reach**
(shares by DM). Sends matter most for reaching people who don't follow you. Saves and comments help, but they
weren't in his top three. Blogs often say sends count "3–5× a like"; I couldn't find Mosseri saying that, so
treat the number as unverified. In practice:

- **Watch time:** a question in the first 3 s, a new small question every ~10 s, and no dead screens.
- **Sends:** a premise people want to argue about with one specific friend ("you'd open the door, I know you").
- **Likes and saves:** a series people want to come back to (Day 1, 2, 3) and something clever enough to rewatch.
- **Comments:** the cheapest answer possible ("1 or 2"), plus a reason to post it ("your comments decide").

### 4.2 Timeline (measured: whisper word times + 1 fps frames)

| Time | Beat | Narration | Picture / on-screen text |
|---|---|---|---|
| 0–5.5 | **Hook** | "The lighthouse saved her. Then it betrayed her." | Headline on screen from frame 0: **THE LIGHT SAVED HER. / THEN IT BETRAYED HER** (white, then red), with "DAY 1 — ON MY PAGE" under it. The image already holds the whole story: a lighthouse beam with dozens of boat lights coming toward it |
| 6–16 | Safe setup | "Marina thought the island was the perfect shelter. Water all around, food for months, an iron door." | Sunset lighthouse; a checklist of chips pops in: ✓SHELTER ✓WATER AROUND ✓FOOD ✓DOOR. Clock 8:55 PM |
| 16–21 | **The turn** | "But she forgot one detail… something she saw every single day." | Sky goes dark; red chip ONE DETAIL… |
| 21–33 | The mechanism (a real fact) | "At exactly 9 p.m. the lighthouse switched on by itself. Automatic. … visible from 12 miles away." | 9:00 PM; the lamp lights; chips AUTOMATIC, VISIBLE FROM 12 MILES |
| 34–47 | Consequence by logic | "On a normal night that light saves ships. But tonight thousands of people on the shore were desperate… only one point was glowing." | Shore crowd silhouettes; chips LIGHT SAVES SHIPS → THOUSANDS OF PEOPLE → ONE POINT OF LIGHT |
| 48–62 | Escalation by counting | "By midnight… Boats. One. Three. Ten. … every single one heading straight for the lighthouse." | Big numbers 1 → 3 → 10 as the lights multiply; ALL HEADING FOR THE LIGHT |
| 62–76 | Stakes | "…only one woman on the island with supplies for one. And some of them were already infected. Zombies can't swim, but they can be brought over." | Boats with people; screen tints **red** on "infected"; chips 1 WOMAN / SUPPLIES FOR ONE, INFECTED, ZOMBIES CAN'T SWIM…, BUT THEY CAN BE BROUGHT |
| 76–92 | The hero acts | "Marina ran up to the lamp. Two hundred steps. The power panel. The switch. The light went out. One by one the boats turned back… All except one." | Spiral stairs with a step counter, panel, lever, the lighthouse dark; chips 200 STEPS, LIGHT OUT, ALL EXCEPT ONE |
| 93–105 | New arrival | "Twenty minutes later a small motorboat bumped into the pier. A man, a woman, and a little girl about six. The man was holding his arm, his sleeve soaked in blood." | Pier; chips 20 MINUTES LATER, A MAN · A WOMAN / AND A GIRL, ABOUT 6, SLEEVE SOAKED IN BLOOD |
| 105–119 | Dilemma | "He knocked on the iron door. 'Please, we have a child. Let us in.' There's only enough food for one, and the man might be infected." | KNOCK! text; a speech bubble from the door; chips FOOD FOR ONE, IS HE INFECTED? |
| 120–125 | Question | "Open the door or keep it shut. Comment one or two…" | **OPEN THE DOOR?** with numbered pills **1 — OPEN** / **2 — KEEP IT SHUT**, then COMMENT 1 OR 2 |
| 125–130 | End card | "…and follow to find out what happens on day three." | THE LIGHTHOUSE / **DAY 3** / FOLLOW FOR DAY 3 / **YOUR COMMENTS DECIDE WHAT HAPPENS** |

### 4.3 Why it works

1. **The hook is a contradiction, and it's on screen.** "Saved her / betrayed her" asks *how?* before the
   first second is over, and the headline stays up for 5 s, so it works with the sound off. The question is
   answered at 33 s, which carries the viewer through the first third.
2. **Frame 0 is the cover.** Lighthouse plus a swarm of boat lights tells the whole story in one picture.
   It works as the grid thumbnail and as the first frame in the feed.
3. **The scary part follows from a real fact.** Lighthouses really are automatic and visible for miles. The
   horror is that the thing that made her safe is the thing that gives her away. "She forgot one detail" turns
   the story into a logic puzzle the viewer feels clever for following. That's why people send it:
   "we would have died, look".
4. **Named third person.** "Marina thought…" lets the narrator know more than the character ("she forgot one
   detail"), and that dramatic irony is what builds the dread. She's easy to spot on every screen (yellow
   raincoat).
5. **A fact label on every beat.** About 25 chip changes in two minutes, one every 3–5 s, plus big numbers
   (1, 3, 10; 200 steps; 20 minutes later). Someone watching muted can follow the whole plot from the chips.
   The chips also give the eye something new while one shot holds for 5–10 s.
6. **Slower and longer than ours.** 260 words in 127 s = **122 wpm**, with 1.2–1.5 s pauses after the big lines.
   About 15 places and ~22 shots (average about 6 s), but something changes every 1–2 s inside each shot
   (a chip, a counter, a light, a tint). The first reference ran 3.6 s shots at 144 wpm. Both hold attention,
   because neither ever leaves the screen static.
7. **Colour carries meaning.** Captions show a whole phrase at once in the lower third: white, **yellow** for
   names/facts, **green** for safety ("that light saves ships", "the light went out"), **red** for danger. The
   whole screen tints red on "infected".
8. **The cheapest comment possible.** "Comment one or two" with numbered pills, and the end card promises
   "your comments decide what happens". The viewer gets a reason to comment and a reason to follow, in the same
   breath.
9. **A series signpost.** "DAY 1 — ON MY PAGE" on the hook frame sends new viewers to the profile, which means
   more watch time on the account and more follows. The end card names the next episode ("DAY 3").
10. **The sound is led by the narration.** Speech −16.7 dB, pauses −30.8 dB: the bed sits **14 dB** under the voice,
    much quieter than the first reference (4.5 dB). Overall −14.5 LUFS, but it **clips** (peak +2.7 dBFS). Don't copy that.

### 4.4 Gaps: our films vs. the two references

Our pacing, measured from our timing files: LIGHTS OUT 127 wpm / 86 s · NIGHT SHIFT 135 / 84 s · SOUL FOR SALE 138 / 88 s ·
AFTER HOURS 142 / 72 s · DON'T REPLY 147 / 77 s · NIGHT ROAD (long form) 140 / 7 min.

| Area | Reference 2 | Ours | Fix |
|---|---|---|---|
| Hook text on screen | A two-line contradiction headline from frame 0, held 5 s | Narration only; the series title card carries no question | Add a **hook headline** on frame 0 (white line + red line), held 3–5 s. The series title shrinks to a tag |
| Frame 0 | The whole story in one image | A dark close-up of the hero, or a lock screen | Design frame 0 as the cover: the threat and the place in one readable picture |
| What makes it scary | One real fact that turns against her | Rules handed down (alert, Dad's card, group chat); DON'T REPLY's rules feel invented | Every premise needs **one true, everyday fact that flips** (NIGHT ROAD's windshield mirror is our best one). Write the "she forgot one detail" line |
| Point of view | Third person, a named heroine, a narrator who knows more | Always "you" | Keep "you" for rules series; try **one named third-person series** to use dramatic irony |
| On-screen info | ~25 fact chips, one every 3–5 s, plus counters | A static HUD + 3 rule cards | Add a **beat chip** (top centre) that labels every beat with a fact, number or state. Use counters for escalation |
| Pace | 122 wpm, 130 s, long holds after reveals | 135–147 wpm, 72–90 s | Narrate at **~125 wpm** (tempo 1.0) and allow **100–130 s** when every beat adds something. Pause 1.2–1.5 s after each reveal |
| Legibility | Bright subject on a dark ground, large figures, one focal object, mood tints | Very dark pixel frames, small sprites, busy sets | Light the subject: hero ≥ 1/6 of the frame height in story shots. Tint the whole frame per mood (red danger, green safe) |
| Protagonist | Signature colour (yellow raincoat) | Grey hoodie | Give the hero (or each series lead) **one signature colour** |
| Captions | Whole phrase, colour-coded incl. **green** | Word-pop, yellow/red only | Keep the pop; add **green = safe** |
| Ending | "Comment 1 or 2", numbered pills, "your comments decide", "follow for Day 3" | "Comment below", "FOLLOW FOR PART 2" | **Numbered choices**, "COMMENT 1 OR 2", promise that the comments decide, name the next episode. Then really make Day 2 from the winning answer |
| Series | "DAY 1 — ON MY PAGE" on the hook frame | Nothing | From Day 2 on, put "DAY 1 ON MY PAGE" under the hook headline |
| Bed level | 14 dB under speech | 4–6 dB under speech (first reference) | Both work. Rule-heavy, quiet stories: keep 4–6 dB. Story-led episodes with lots of narration: try 8–10 dB under |
| Shareability | A logic dilemma everyone has an opinion on | Moral dilemmas, but some are one-sided (grab the tablet is clearly right) | Both choices must cost something real (food for one *and* a child at the door) |

### 4.5 Hook formulas that fit our genre

- **Contradiction:** "The ___ saved her. Then it ___ her." / "It was the safest room in the house. That was the problem."
- **The forgotten detail:** "He prepared for everything. Except one thing he did every night."
- **A number and a cost:** "Supplies for one. Four people at the door."
- **Everyday rule, flipped:** "Your dad said it was illegal. It isn't. He lied about why." (NIGHT ROAD)

Write the hook headline first, then the narration's first line can repeat it word for word, as the reference does.

### 4.6 What to change for the next video (in order)

1. A hook headline component (frame 0, two lines, white + red, plus "DAY n ON MY PAGE" from Day 2 on).
2. A `BeatChip` component (top centre, under the HUD) with a fact label per beat, plus big count-up numbers.
3. A script pass: one true fact that flips; a "forgot one detail" turn by 15% of the runtime; a new question every ~10 s.
4. Numbered choice pills + "COMMENT 1 OR 2" + an end card reading "YOUR COMMENTS DECIDE WHAT HAPPENS · FOLLOW FOR DAY n+1".
5. Brighter, larger subjects and a mood tint per beat; a signature colour for the hero.
6. Narration at tempo 1.0 (~125 wpm), 1.2 s holds after reveals; runtime up to ~120 s when it earns it.
7. Make Day 2 of an existing series from the comment result (AFTER HOURS or DON'T REPLY) so the promise is kept.

---

## 5. Pre-render checklist (both references)

- [ ] **Hook headline on frame 0** (white + red, held 3–5 s); frame 0 works as the cover; "DAY 1 ON MY PAGE" from Day 2 on.
- [ ] One true everyday fact that flips; a question opens in the first 3 s and a new one every ~10 s.
- [ ] A beat chip or counter changes every 3–5 s; nothing on screen is static for more than ~2 s.
- [ ] Premise sentence + threat rule fit in the first 11 s.
- [ ] Title card by ~2 s; end card mirrors it.
- [ ] 3 rules, each preceded by its object on screen.
- [ ] Offscreen proof by sound before the threat is seen.
- [ ] Threat shown after 60%, through something, one move.
- [ ] Final dilemma involves an innocent; both choices cost something; **numbered pills, "COMMENT 1 OR 2"**;
      end card: "YOUR COMMENTS DECIDE WHAT HAPPENS · FOLLOW FOR DAY n+1".
- [ ] Subject is bright and large enough to read on a phone; mood tint per beat; captions use green for safe.
- [ ] Each concrete noun is drawn; shots ≤ 4 s, or longer holds (up to ~8 s) only when chips/counters keep changing.
- [ ] HUD meter moves on every sound; clock advances in minutes.
- [ ] Bed runs throughout, pauses 4–6 dB under speech; room tone cuts at the event; one dropout.
- [ ] Mix −14 LUFS, peak ≤ −1.5 dBFS; every line transcribes back correctly.
- [ ] Original premise, names and UI (no real brands, no real emergency-alert look-alike claims).

## Sources

- Reference breakdown: our own measurements (faster-whisper medium.en transcript, ffmpeg scene
  detection, EBU R128 loudness, spectrum of the pauses).
- Music licensing:
  [Thematic vs Pixabay](https://hellothematic.com/thematic-vs-pixabay/),
  [HeyGen: removing a Content ID claim](https://help.heygen.com/en/articles/8986144-how-to-remove-your-content-id-claim-in-youtube),
  [Newcastle University music site list](https://www.newcastle.edu.au/__data/assets/pdf_file/0006/875994/Suggested-music-file-sites.pdf),
  [licenseorg: Incompetech](https://licenseorg.com/guide/music-audio/incompetech),
  [CC wiki: Kevin MacLeod](https://wiki.creativecommons.org/wiki/Case_Studies/Kevin_MacLeod),
  [vidIQ: YouTube Audio Library rules](https://vidiq.com/ru/blog/post/how-to-best-free-music-youtube-royalty-free),
  [SocialPilot: YouTube Audio Library](https://www.socialpilot.co/youtube-marketing/youtube-audio-library).
- Reels ranking (section 4.1):
  [Social Media Today: Instagram shares algorithm insights (Mosseri, 2025)](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/),
  [Fanpage Karma: Reels algorithm 2025](https://www.fanpagekarma.com/insights/instagram-reels-algorithm/),
  [Socialinsider: Reels algorithm](https://socialinsider.io/blog/instagram-reels-algorithm/),
  [PostEverywhere: 5 ranking signals](https://posteverywhere.ai/blog/how-the-instagram-algorithm-works) (marketing blog; the "sends = 3–5× likes" figure is unverified).
- Shorts hooks (marketing blogs, treat the numbers loosely):
  [Opus: Shorts hook formulas](https://www.opus.pro/blog/youtube-shorts-hook-formulas),
  [GoFaceless: high-retention Shorts](https://www.gofaceless.ai/en/blog/high-retention-youtube-shorts-attributes).
