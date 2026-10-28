# Pixel Dread kit

Reusable source + assets for the Pixel Dread style (pixel-sprite characters, smooth
camera/light effects, word-pop captions, HUD, choice ending) on Remotion 4.0.538.

```
kit/pixelkit.py      pixel primitives, dithering, 3x5 font, atlas packer
kit/characters.py    cast generator -> public/sprites/<name>.png/.json
kit/sets.py          set layers (bedroom, hall, porch) + props atlas
scripts/kokoro_narrate.py   Kokoro TTS + real word timings (+ per-sentence pauses)
scripts/sfx_mix.py   synthesised SFX kit + mixer driven by cues.json
src/kit/             theme, World/camera, PixelSprite/PixelText, effects, overlays
src/film/Film.tsx    15 s sample film ("The Knock, Part 1")
script.json cues.json   sample narration script and SFX cues
public/              fonts (OFL), sprites, sets, audio/mix.wav
```

Rebuild everything:
```sh
npm i
python3 kit/characters.py public/sprites && python3 kit/sets.py public
python3 scripts/kokoro_narrate.py script.json audio/raw --voice am_onyx --speed 1.2 --models <kokoro models dir>
# narration chain + mix: see SKILL.md section 9
npx remotion render src/index.ts PixelDreadSample out/sample.mp4 --codec=h264 --crf=18 --x264-preset=veryfast
```
Kokoro model files: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0

## AI-generated assets (ChatGPT image gen → kit)
Prompts: `prompts/asset-prompts.md` (attach `prompts/refs/*`). Raw images go in `incoming/<id>_gpt_v<n>.png`.
```sh
python3.12 kit/make_refs.py .                          # style reference images for the prompts
python3.12 kit/ingest.py kit/ingest_manifest.json      # sheets -> public/sprites/<atlas>.png/.json, plates -> public/sets/<name>_bg.png
python3.12 kit/fg_cuts.py                              # occluder layers -> public/sets/<name>_fg.png
python3.12 kit/review_assets.py <dir>                  # contact sheets next to the kit hero for scale
npx remotion render src/index.ts AssetTest out/asset-test --sequence --image-format=png --scale=0.5
```
New sheet: add it to `kit/ingest_manifest.json` with frame names in reading order (rows top→bottom, left→right).
If a sheet reports MISMATCH, lower that source's `merge` (sprites too close) or raise it (a sprite split into bits).
Plates are ~160 art px wide: `<SetLayer src="sets/x_bg.png" width={plates.x.w} />`.
