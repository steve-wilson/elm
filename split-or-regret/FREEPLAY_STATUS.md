# freeplay.html — Build Status

## What this file is
`split-or-regret/freeplay.html` — an optional free-play mode after the main game.
Single-file HTML/CSS/JS, no build step. Opened directly in browser.

## Completed steps

### Step 1 — Shell ✅
Page structure, theme/model-name overlays, dataset selector, localStorage helpers (`fpLoad/fpSave/fpGet/fpSet`), shared CSS wired up.

### Step 2 — Leaderboard + lock-in ✅
- Per-model run history (left column of `#lb-grid`)
- Leaderboard sorted by best val (unlocked) or testAcc (locked), using `bestRunOf(ms)` helper
- Reveal overlay (`startReveal` / `confirmReveal`) — costs nothing, reveals testAcc
- FLIP animation for row reordering
- Fixed-width grid columns to prevent misalignment: `26px minmax(60px,1fr) 65px 48px 90px`

### Step 3 — Chart A (HP Map) ✅
- SVG scatter: 2D for 2-HP models, horizontal line + dots for 1-HP models
- Dot radius `3 + valToT(val)*11`, color from RAMP
- `valToT` floor at 0.60 (not 0.33) for better visual distinction in 70–90% range
- Jitter stored per-run (`jx`, `jy`) at 2 * dataset `jitterMult`
- Legend: 3 circles (0.65, 0.78, 0.92 val) in SVG, height=20 to avoid clipping
- Per-model HP map (shows selected model's runs only)

### Step 4 — Chart B (dot histogram) ✅
- Stacked dot histogram: x = val accuracy (5% bins), dots stack upward per bin
- Dot colored by model, auto-shrinks radius if stacks get tall
- Dynamic x range bracketing actual data ± 4%, snapped to 5% bin boundaries
- Hover tooltips showing model, HPs, val accuracy
- Legend shows only models with ≥1 run
- Charts A and B are side-by-side (`flex-direction:row`), stack on ≤700px mobile

### Step 5 — Deploy + scoring ✅
- Appears after 3 models are locked in
- Locked model picker buttons (one per locked model, shows test %)
- **Head-to-head animation**: two 10-column block grids (Your Model vs Competitor)
  - Each block lights green (correct) or red (wrong) at 85ms/tick
  - Running tally `correct / total` updates live under each grid
- **Scoring** (after animation + 500ms delay):
  - Base: 1 pt per % test accuracy
  - Unused credits: +1 per credit remaining
  - Beat-competitor bonus: +25 if `testAcc >= competitorScore/100` (accuracy vs accuracy, NOT points vs points)
  - Score counter animates (cubic-ease-out, 900ms)
  - Green/orange outcome banner
- Saves to `fpGet/fpSet('highScores', {})` per dataset; updates "Your best" in leaderboard header

## Layout notes
- Top-level structure (top to bottom):
  1. Header (title, Back link, hamburger menu)
  2. Dataset selector card (name buttons, description, "Goal: beat X%" line)
  3. Split container (train/val/test blocks, dual-range sliders) — collapses on lock
  4. `hp-acc-row` flex: left=hp-panel (model picker + HP sliders), right column (train-btn-wrap → accuracy-panel)
  5. Leaderboard panel (lb-grid: runs history | leaderboard)
  6. Charts section (Chart A | Chart B side-by-side)
  7. Deploy section

- Right column of hp-acc-row: `gap:0` (flush borders), `train-btn-wrap` padding `24px 20px` to match progress-panel height
- Credits badge lives inside `train-btn-wrap` (right side, space-between)
- `#competitor-score` in dataset selector card; `#competitor-score-lb` + `#high-score` in leaderboard header
- "Beat X% to win ⭐" uses `color:var(--text)` (not `--accent`, which looked like val)

## Remaining steps

### Step 6 — Dataset 3 special controls ✅
- `#ds3-panel` shown only when `curDatasetId === 3` (via `renderDs3Panel()`)
- Distribution bar: 85% Class A (accent) | 15% Class B (val)
- Undersample A slider + Oversample B slider → stored as `undersampleAmt` / `oversampleAmt`
- `getResampleFactor()` → 0–1 from combined slider values (0–150 combined maps to full effect)
- `computePerClassAccuracy(valAcc)` → `{accA, accB}` — without resampling accB can be as low as 10%
- Per-class bars shown in `#class-breakdown` inside accuracy panel (Dataset 3 + trained only)
- `ds3-warning` shown if `accB < 0.35`
- `computeRealWorldAcc()` now reduces penalty proportionally to `getResampleFactor()`
- Sliders re-compute `classAcc` live and update accuracy panel immediately

### Step 7 — Shareable URL ✅
- On deploy completion (after score animation): URL updated via `history.pushState` with
  `?r=<score>&d=<dataset>&m=<model>&t=<testAcc>`
- "📋 Copy link" button uses `navigator.clipboard` (falls back to prompt)
- On page load: `checkSharedResult()` reads URL params and shows `#shared-result-card`
- "Add to my scores": saves shared score as high score if higher, switches to that dataset
- "Dismiss": hides card and cleans URL via `history.replaceState`

### Step 8 — Dataset selector polish ✅
- `fpSet('dataset1Completed', true)` called on first deploy on Dataset 1 → unlocks Datasets 2–5
- ⭐ stars already implemented in `renderDatasetSelector` via `const star = ...`
- "↺ Try again" button added to deploy final section (calls `doReset()`)

## Key state variables
```
curDatasetId    — active dataset (1–5)
trainPt         — index where val starts (default: total * 0.33)
testStartPt     — index where test starts (default: total * 0.67)
splitLocked     — bool, locked after first train
selModel        — display index 0–5
busy            — training in progress
credits         — remaining compute budget
modelOrder[]    — shuffled curveIdx per session
pendingRevealIdx — model awaiting test reveal (-1 if none)
deployedIdx     — which model was deployed (-1 if not yet)
undersampleAmt  — Dataset 3 undersample slider value (0–100)
oversampleAmt   — Dataset 3 oversample slider value (0–100)
mSt[]           — per-model state: hp1, hp2, trained, lockedIn, trainAcc, valAcc, testAcc,
                   lockedHp1, lockedHp2, classAcc ({accA, accB} for DS3), runs[]
```

## Key functions
- `computeAccuracy(displayIdx, hp1, hp2)` → `{trainAcc, valAcc}`
- `computeTestAcc(valAcc)` → testAcc (noise based on val set size)
- `computeRealWorldAcc(testAcc)` → real-world acc (applies Dataset 3 imbalance penalty)
- `bestRunOf(ms)` → run object with highest valAcc from ms.runs
- `valToT(val)` → [0,1] with floor 0.60 for color/size mapping
- `renderChartA()` / `renderChartB()` — SVG charts, both called after each train
- `renderLeaderboard()` — FLIP-animated, uses bestRunOf for unlocked models
- `showDeploySection()` — one-shot reveal, guarded by `display !== 'none'`
- `deployModel(idx)` — runs head-to-head animation then calls `showDeployFinal()`

## localStorage keys
- `sor_state` — shared app state (theme, modelSet), managed by `js/state.js`
- `fp_freeplay` — freeplay-specific: `{ highScores: {1:112, 2:88, ...}, dataset1Completed: bool }`
