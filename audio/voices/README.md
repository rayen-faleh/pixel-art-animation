# Voice reference clips (Chatterbox voice cloning)

arctic_{aew,bdl,rms,jmk}.wav: ~15 s each, concatenated `arctic_a00xx` utterances from the CMU ARCTIC
databases (http://festvox.org/cmu_arctic/; aew/bdl/rms = US male, jmk = Canadian male), resampled 16→24 kHz.

Licence: the packed archives we downloaded contain only `wav/` and `etc/` (no COPYING file), and the
festvox page states no terms. The CMU team's ARCTIC paper describes the package as "free software, without
restriction on commercial or non-commercial use"
(https://www.isca-archive.org/ssw_2004/kominek04b_ssw.pdf), and pyroomacoustics lists it as permissive with
attribution (https://pyroomacoustics.readthedocs.io/en/stable/pyroomacoustics.datasets.cmu_arctic.html).
Treat this as attribution-required; credit "CMU ARCTIC (Carnegie Mellon University)" if a cloned voice ships.

user_ref.wav: the user's own voice (10.2 s, supplied 2026-10-27 as an MP3, converted to 24 kHz mono and
silence-trimmed; user_raw.wav is the untrimmed conversion). Used with the user's permission as the narrator
for NIGHT SHIFT and LIGHTS OUT Part 1. Settings: exaggeration 0.55, cfg 0.65, temperature 0.8, tempo 1.05.
The ARCTIC clips above were auditioned and rejected; they are not in any film.
