# Contributing

Thanks for helping make training advice better and free.

## Ground rules

1. **Evidence first.** New claims need a peer-reviewed source (meta-analyses and RCTs preferred). Add it to `WS.REFS` in `js/data/references.js` with the full citation. Leave `url` empty to get a PubMed search link automatically.
2. **Be honest about uncertainty.** If the evidence is weak or mixed, say so in the text.
3. **No build step.** Plain HTML, CSS and JavaScript only, so anyone can open `index.html` and contribute.

## Add an exercise

In `js/data/exercises.js`, add an `X(...)` line under the right pattern. Order matters: within a pattern, list exercises from best to worst.

```js
X('id', 'Name', 'pattern', 'equipment', skill /* 1-3 */, 'S' /* S|A|B */,
  'Why it works (the science).', 'Form cues.', { refs: ['refKey'] }),
```

Optional flags: `axial` (heavy spinal load), `impact` (jumping), `main` (big barbell lift), `senior` (preferred for 60+).

If [free-exercise-db](https://github.com/yuhonas/free-exercise-db) has the exercise, add its folder name to the map in `js/data/demos.js` to get an animated demo.

## Add a split

In `js/data/splits.js`, add an object with `days`, `fit` scores (0–5 per goal and level), `evidence`, `refs` and a `build(days, profile)` that returns days made of pattern slots. The engine picks exercises, sets and reps automatically.

## Test your change

Open the browser console on the page and run the engine across many profiles:

```js
WS.engine.recommend({ age: 30, gender: 'female', goal: 'muscle', level: 'intermediate', days: 4,
  equipment: 'gym', bodyType: 'average', focus: '', minutes: 60 })
```
