#!/usr/bin/env bash
# KEEP PRETENDING audio: narration (audio/kp_raw) -> cues -> mix -> public + src timing.
# PY = a python with numpy/scipy/soundfile (the Chatterbox venv works). Override: PY=... scripts/build_kp_audio.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PY:-python3}
$PY scripts/build_kp_cues.py audio/kp_raw/timing.json kp-cues.json
ffmpeg -v error -y -i audio/kp_raw/narration.wav -af "highpass=f=60,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120:makeup=3dB,loudnorm=I=-15:TP=-2:LRA=7" -ar 48000 audio/kp-narration.wav
LEN=$($PY -c "import json;w=json.load(open('audio/kp_raw/timing.json'))['words'];e=[x for x in w if x['line']=='P168'][-1]['e'];print(round(e*30)/30+195/30)")
$PY scripts/sfx_mix.py audio/kp-narration.wav kp-cues.json audio/kp-mix_pre.wav --length "$LEN"
ffmpeg -v error -y -i audio/kp-mix_pre.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 public/audio/kp-mix.wav
cp audio/kp_raw/timing.json src/kp-timing.json
ffmpeg -hide_banner -i public/audio/kp-mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
