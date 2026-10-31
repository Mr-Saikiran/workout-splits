# Workout Splits

A free, open-source, **science-backed workout split planner** for gym lovers and fitness enthusiasts.

Enter your **age, gender, body type, goal**, experience, days per week, session length, equipment and an optional focus area. The app ranks 15 training splits against the research and builds a full week of training: exercises, sets, reps, effort (reps in reserve), rest times, weekly volume per muscle, cardio, yoga and Pilates.

No build step, no tracking, no backend. Everything runs in the browser.

## Features

- **Planner**: personalised split ranking with reasons and caveats, a generated program you can swap exercises in, **exercise variety from Nil to Extreme** (exercises rotate every 8, 4, 2 or 1 weeks across a 4–24 week program that repeats as new cycles, with a reshuffle button), weekly sets per muscle vs. target, and notes for your age, gender, body type and nutrition.
- **15 splits**: Full Body, Upper/Lower, Push/Pull/Legs, **Bro Split**, Arnold, PHUL, Upper/Lower + PPL, Torso/Limbs, Anterior/Posterior, 5×5 Strength, Upper/Lower/Full, **Body-Part Specialization** (glutes, arms, chest, back, shoulders, legs, core), Strength Circuit, Athletic Performance, Active Aging.
- **Exercise library**: 237 exercises (barbell, dumbbell, machine, cable, bodyweight, band) by body area, ranked S/A/B by evidence. Tap one for an animated demo of the start and end position (212 have one), form cues, and Google image and video searches.
- **HIIT & Calisthenics**: Norwegian 4×4, Tabata, beginner intervals, EMOMs, and bodyweight skill progressions (push-up → one-arm, pull-up → muscle-up, pistol, L-sit, handstand push-up, front lever).
- **Yoga**: 10 routines (beginners, lifters, low back, hips, balance, chair yoga…) and a pose library.
- **Pilates**: 5 mat routines (beginner, core, glutes, back care, full body).
- **Longevity**: the four-pillar framework (strength, Zone 2, intervals, balance/mobility) with self-tests.
- **Science**: every principle with its peer-reviewed source.

## How the recommendations work

| Input | What it changes |
| --- | --- |
| Goal | Split ranking, rep ranges, rest, weekly volume, cardio, calories |
| Experience | Weekly sets (≈10 / 14 / 18 per muscle), exercise skill level, effort |
| Age | Teens: full body, technique first. 40–59: recovery. 60+: full body, balance and power work, joint-friendly picks |
| Gender | Notes only (rest periods, cycle, bone health). Men and women gain at similar relative rates, so the split ranking is the same |
| Body type | Calorie and cardio advice, conditioning finishers, low-impact choices |
| Days / minutes | Which splits are possible; sets are trimmed to fit your session |
| Equipment | Exercise selection (full gym, home dumbbells, bodyweight) |
| Focus area | Specialization split: focus muscle first in each session, about 40% more volume |
| Variety + program length | Nil: same exercises throughout. Low / Medium / High / Extreme: a seeded random pick from the top-ranked options, rotating every 8 / 4 / 2 / 1 weeks. Strength main lifts stay fixed below Extreme. After the last week (up to 24) the program repeats as a new cycle with a fresh mix |

The core principles: train each muscle about 2× per week, do 10–20 hard sets per muscle per week, take sets close to failure, prefer exercises that load the muscle in a stretched position, and progress the load. Full citations are on the **Science** tab and in [`js/data/references.js`](js/data/references.js).

> Body-type labels (ectomorph/mesomorph/endomorph) don't predict training response. They're used only as shorthand for current body composition.

## Demos, videos & credits

- **Exercise demos**: start and end photos from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, Unlicense), loaded from jsDelivr at a pinned commit. The mapping is in [`js/data/demos.js`](js/data/demos.js).
- **Exercises and workouts** also link to Google Images and Google Videos searches for their name.
- **Yoga** links to [Yoga With Adriene](https://www.youtube.com/@yogawithadriene) and **Pilates** to [Blogilates](https://www.youtube.com/@blogilates), as searches inside each channel so the links never break.

**Longevity framework credit: Bryan Johnson**, ["Everyone Is Wrong About Exercise"](https://youtu.be/JNuORofHhrk). We added peer-reviewed sources for each pillar.

This project isn't affiliated with or endorsed by any of these creators.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

To host it free, enable **GitHub Pages** (Settings → Pages → deploy from `main`, root).

## Mobile apps (Android & iPhone)

The same app, wrapped with [Capacitor](https://capacitorjs.com/) and bundled to work offline (exercise demo images need a connection). Download from [Releases](https://github.com/Mr-Saikiran/workout-splits/releases/latest):

- **Android**: `workout-splits-<version>-android.apk`. Open it on your phone and allow installing from your browser or file manager. Android 7.0+.
- **iPhone**: `workout-splits-<version>-ios-unsigned.ipa`, an unsigned preview (no Apple Developer account yet). Install with AltStore or Sideloadly, which sign it with your Apple ID; free Apple IDs need re-signing every 7 days.

[`.github/workflows/mobile.yml`](.github/workflows/mobile.yml) builds both on every push to `main`. To publish a release: bump `version` in `package.json`, then **Actions → Mobile apps → Run workflow** with *publish* ticked (or push a `v<version>` tag).

The APK is debug-signed unless these repository secrets exist, in which case it is release-signed (needed for the Play Store):
`WS_KEYSTORE_BASE64` (base64 of a `.jks` keystore), `WS_KEYSTORE_PASSWORD`, `WS_KEY_ALIAS`, `WS_KEY_PASSWORD`.

Build locally (needs Node 22+, plus Android Studio or Xcode):

```bash
npm install
```

```bash
npm run build:web && npx cap add android && npx cap open android
```

Icons and splash screens come from `assets/` (regenerate with `npm run icons`); CI turns them into every size with `@capacitor/assets`.

## Project layout

```
index.html            page shell and tabs
css/styles.css        styles (light and dark)
js/data/references.js studies and the yoga / Pilates channels
js/data/exercises.js  muscles, movement patterns, exercise database
js/data/demos.js      exercise → demo image mapping, Google search links
js/data/splits.js     split catalog and templates
js/data/yoga.js       yoga routines and poses
js/data/movement.js   HIIT, calisthenics, Pilates, longevity
js/engine.js          split scoring and program generation
js/app.js             UI
assets/               app icon and splash sources
capacitor.config.json Android / iOS app settings
scripts/              build-web (www/ for the apps), make-icons
.github/workflows/    mobile app builds
```

## Contributing

PRs are welcome, especially new exercises, splits, translations and better sources. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

This is educational content, not medical advice. Talk to a doctor before starting if you have a medical condition, are pregnant, or are returning to exercise after a long break.

## License

[MIT](LICENSE)
