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

### Step 6 — Dataset 3 special controls (NOT STARTED)
Dataset 3 has `specialBonus: 'imbalance'` — pedagogical concept: class imbalance.
- Add undersample/oversample sliders visible only for Dataset 3
- Per-class accuracy breakdown in accuracy panel
- Warning if majority class dominates (e.g., "your model may be predicting the majority class")
- `computeRealWorldAcc()` already applies an imbalance penalty for Dataset 3

### Step 7 — Shareable URL (NOT STARTED)
- Encode final score + dataset + model into URL params on deploy
- On page load: if URL params present, show a result card "Steve got 112 pts on Dataset 1"
  with "Add to my leaderboard" / "Dismiss" buttons
- Keep it lightweight — no server needed, just `URLSearchParams`

### Step 8 — Dataset selector polish (NOT STARTED)
- Datasets 2–5 locked until Dataset 1 is completed (`fpGet('dataset1Completed', false)`)
  - Already partially implemented in `renderDatasetSelector` via `ds1ok` flag
  - Need to SET `dataset1Completed = true` somewhere after deploy on Dataset 1
- ⭐ stars on dataset buttons when you've beaten the competitor score for that dataset
  - Already implemented: `const star = (hs >= d.competitorScore) ? ' ⭐' : ''`
- Reset button (already in menu) — resets credits/runs for current dataset, keeps high scores
- Consider: "Try again" button after deploy that resets only the current dataset session

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
mSt[]           — per-model state: hp1, hp2, trained, lockedIn, trainAcc, valAcc, testAcc,
                   lockedHp1, lockedHp2, runs[]
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
