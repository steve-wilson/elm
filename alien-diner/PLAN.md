# Alien Diner — Interactive Plan

**Module:** Introduction to classification — the model learns from data, not rules  
**Course position:** Early in course, likely one of the first interactives  
**Target audience:** Students with some coding experience, no ML background, familiar with AI/LLMs  
**Time budget:** ~30 min pre-class (core); advanced mode adds 10–20 min optional

---

## Concept

Students run a diner where two species of alien — **Vorbs** and **Glims** — come to eat. Each species only likes one kind of food. No one tells students the rules. They learn which is which by studying labeled examples, then apply that knowledge as customers arrive at the counter.

This directly attacks two core misconceptions:
- "The model just knows things automatically" — students discover *they* don't either, without training examples
- "We program the model with rules" — no rules appear anywhere; behavior is entirely driven by examples

The restaurant is the skin. The classifier is the lesson.

---

## Opening orientation card

> Recommendation systems, spam filters, medical diagnostic tools — all of them do the same thing: look at something new and decide which category it belongs to. They don't follow hand-written rules. They learn from labeled examples.
>
> You're about to run a diner. Two kinds of aliens are coming to eat, and they each want different food. No one's going to tell you which is which — you'll have to figure it out from the customers you've already served.
>
> **Your goal: learn from your customers. Then find out if you learned the right things.**

Dismissible with "Let's go." Dismiss state stored in localStorage so it doesn't reappear on refresh.

---

## Core mechanic

Aliens queue and walk up to a diner counter one at a time. Two food options sit in front of the student. Student clicks the right food before the alien gets impatient and leaves.

- **Correct** → happy alien animation, walks away satisfied, soft positive feedback
- **Wrong** → disgusted reaction, correct food briefly highlighted, alien leaves unhappy
- **Miss** → alien leaves hungry, counts as wrong in accuracy score

A **Feature Inventory** panel sits beside the counter — a running tally of which features appeared most often with each species, built from labeled training examples the student has already seen. It updates live during the training phase. Studying it is the strategy; ignoring it means guessing.

---

## Alien species design

Two species distinguished by four visual features (SVG, no images):

| Feature | Vorb | Glim |
|---|---|---|
| Body shape | Round (ellipse) | Angular (diamond) |
| Eyes | 1 large eye | 2 smaller eyes |
| Legs | 2 tentacle-like legs | 4 stick legs |
| Texture | Spots | Stripes |

**True label rule:** body shape determines species (round = Vorb, angular = Glim). Other features are correlated with species in training data but not perfectly — they can mislead near the boundary.

No color-only encoding. All features are shape/texture-based. Accessible by design.

---

## Level 1 flow

### Phase 1: Training (watch labeled customers)

- 10 labeled aliens appear one by one, every ~1.5 seconds, automatically
- Each is labeled "VORB" or "GLIM" as they appear
- Feature inventory updates live with each new example
- "Start the Rush" button becomes available once all 10 are shown
- Student can take as long as they want here

**Training examples (10):**

| # | Body | Eyes | Legs | Texture | Label |
|---|---|---|---|---|---|
| 1 | Round | 1 | 2 | Spots | Vorb |
| 2 | Angular | 2 | 4 | Stripes | Glim |
| 3 | Round | 1 | 2 | Spots | Vorb |
| 4 | Angular | 2 | 4 | Stripes | Glim |
| 5 | Round | 1 | 2 | Spots | Vorb |
| 6 | Angular | 2 | 4 | Stripes | Glim |
| 7 | Round | 1 | 4 | Spots | Vorb ← unusual legs |
| 8 | Angular | 2 | 2 | Stripes | Glim ← unusual legs |
| 9 | Round | 2 | 2 | Spots | Vorb ← unusual eyes |
| 10 | Angular | 1 | 4 | Stripes | Glim ← unusual eyes |

Feature inventory after all 10:
- Vorbs (5): Round body 5/5, 1 eye 4/5 (80%), 2 legs 4/5 (80%), Spots 5/5
- Glims (5): Angular body 5/5, 2 eyes 4/5 (80%), 4 legs 4/5 (80%), Stripes 5/5

### Phase 2: The Rush (classify 10 customers, timed)

Aliens walk in from the right. Patience bar depletes. Student clicks Vorb food or Glim food.

**Rush queue (10, progressively harder toward the boundary):**

| # | Body | Eyes | Legs | Texture | True label | Difficulty |
|---|---|---|---|---|---|---|
| 1 | Round | 1 | 2 | Spots | Vorb | Easy — all features align |
| 2 | Angular | 2 | 4 | Stripes | Glim | Easy — all features align |
| 3 | Round | 1 | 2 | Spots | Vorb | Easy |
| 4 | Angular | 2 | 4 | Stripes | Glim | Easy |
| 5 | Round | 1 | 4 | Spots | Vorb | Medium — legs differ |
| 6 | Angular | 2 | 2 | Stripes | Glim | Medium — legs differ |
| 7 | Round | 2 | 2 | Spots | Vorb | Medium — eyes differ |
| 8 | Angular | 1 | 4 | Stripes | Glim | Medium — eyes differ |
| 9 | Round | 2 | 4 | Stripes | Vorb | Hard — 3 of 4 features say Glim |
| 10 | Angular | 1 | 2 | Spots | Glim | Hard — 3 of 4 features say Vorb |

### Phase 3: Results

Side-by-side comparison: student accuracy vs. model accuracy.

**Model prediction logic (weighted feature vote from training frequencies):**
- Round body → +2 Vorb; Angular → +2 Glim
- 1 eye → +2 Vorb; 2 eyes → +2 Glim
- 2 legs → +1 Vorb (80% of Vorbs); 4 legs → +1 Glim (80% of Glims)
- Spots → +2 Vorb; Stripes → +2 Glim
- Higher total wins

Model predictions for hard cases:
- Rush #9 (Round, 2 eyes, 4 legs, Stripes): Vorb=2, Glim=5 → model predicts **Glim** (WRONG — true label Vorb)
- Rush #10 (Angular, 1 eye, 2 legs, Spots): Glim=2, Vorb=5 → model predicts **Vorb** (WRONG — true label Glim)

**Model accuracy: 8/10 = 80%**

Students who relied on body shape alone: 10/10 = 100%  
Students who used the feature inventory (majority vote): 8/10 = 80%

### Surprise moment

On rush aliens #9 and #10, the feature inventory (majority vote) gives the wrong answer — and so does the model, because the model learned exactly what the training data showed. Students who focused on body shape get it right; students who trusted the inventory get it wrong alongside the model.

The post-results reveal: *"Both you and the model got confused by aliens 9 and 10 — because the feature inventory pointed the wrong way. The true label? Body shape is the real difference between Vorbs and Glims. But the training data didn't make that clear enough. What would you have needed to see to figure that out?"*

This teaches: the model can only learn what the training data shows it. If the data is misleading, the model is misled.

### Phase 4: Check-in pulse

"How's it going so far?" — Great / Okay / Struggling  
Optional free-text: "Any feedback to help improve this?"  
Logged, no branching.

---

## Feature Inventory design

Compact side panel, always visible during the rush. Shows:

```
FEATURE INVENTORY (i)

VORBS tend to have:
● Round body     5/5
● 1 eye          4/5 ████████░░
● 2 legs         4/5 ████████░░
● Spots          5/5

GLIMS tend to have:
◆ Angular body   5/5
◆ 2 eyes         4/5 ████████░░
◆ 4 legs         4/5 ████████░░
◆ Stripes        5/5
```

Updates live during training phase as each labeled alien is shown. Read-only during rush.

---

## Levels 2 and 3 (TBD)

Not designed yet. Ideas to explore:
- Level 2: Introduce a 3rd alien species (3-class classification, messier boundaries)
- Level 3: TBD

These will be designed after Level 1 is built and tested.

---

## Reflection / quiz questions (after all levels)

1. **Describe a specific alien you got wrong or weren't sure about.** What features did it have? Why was it hard to decide — and why did the model struggle with the same one?

2. **The feature inventory showed a pattern that turned out to be misleading for some aliens. In your own words: what does that tell you about how models can go wrong?**

3. *(Multiple choice — targets core misconception)*
   **Why did the model make the same mistake as students who used the feature inventory?**
   - a) The model wasn't trained long enough
   - b) Both learned from the same examples — which showed a misleading pattern ✓
   - c) The model made a random error
   - d) Visual classification is too hard for current AI

4. **In your own words:** what does a classifier actually learn from data? Don't use the word "pattern."

5. *(Slider)* Before this, how much did you think an AI "understood" what it was classifying? How about now?

---

## Tooltip inventory

| Term / Element | Tooltip text |
|---|---|
| Training examples | Labeled customers you've already served — you know what they are and what they wanted. The model studies these before the rush begins. |
| Feature inventory | A tally of which features appeared most often with each species, based on what you've seen so far. This is how the model "thinks" — it counts patterns in past examples. |
| Classifier | A system that looks at something new and decides which category it belongs to, based on labeled examples. |
| Accuracy | Out of all the customers you served, what fraction got the right food. 100% = perfect; 50% = no better than guessing. |
| Feature | A measurable property — like body shape, number of eyes, or texture. The model can only notice features you show it. |
| Prediction | The model's decision on a new customer it hasn't seen before. |
| (i) on alien card | These are the features visible to you — and to the model. Nothing else is used to make the decision. |
| Miss | You didn't click in time. The alien left without being served. Counts as wrong in your accuracy score. |

---

## Log schema

```json
{
  "schema_version": "1.0",
  "interactive_id": "alien-diner",
  "interactive_title": "Alien Diner",
  "session": {
    "started_at": "<ISO>",
    "completed_at": "<ISO>",
    "duration_seconds": 0,
    "theme_chosen": "",
    "theme_changes": 0,
    "completed_all_steps": false
  },
  "per_level": {
    "level1": {
      "training_examples_shown": 10,
      "queue_length": 10,
      "served": [
        {
          "alien_id": "",
          "true_label": "",
          "student_answer": "",
          "model_answer": "",
          "outcome": "correct|wrong|miss",
          "reaction_time_ms": 0,
          "timestamp": ""
        }
      ],
      "student_accuracy": 0.0,
      "model_accuracy": 0.0,
      "student_model_agreement_rate": 0.0,
      "feature_inventory_visible": true,
      "checkin": { "rating": "", "feedback": "" }
    }
  },
  "reflection_answers": { "<question_slug>": "<student answer>" },
  "quiz_answers": { "<question_slug>": { "answer": "", "correct": true } },
  "exploration_summary": {
    "advanced_mode_entered": false,
    "time_per_level_seconds": {},
    "edge_cases_tried": []
  },
  "leaderboard": {
    "exploration_score": 0,
    "reflection_depth_score": 0,
    "accuracy_delta_score": 0,
    "total_score": 0
  }
}
```

Log filename: `alien-diner_YYYY-MM-DD_log.json`

**Leaderboard scoring:**
- `exploration_score` = edge cases tried in advanced mode × 5
- `reflection_depth_score` = total chars of open-ended answers (max 500)
- `accuracy_delta_score` = accuracy improvement level to level (when levels 2+ exist)

---

## File structure

```
alien-diner/
├── index.html          # theme picker → entry point
├── level1.html         # the diner (Level 1)
├── reflection.html     # reflection + quiz
├── done.html           # log download + completion
├── js/
│   ├── state.js        # localStorage state management
│   ├── log.js          # interaction log builder
│   └── themes.js       # theme apply/init
└── css/
    └── shared.css      # theme variables + shared components
```

Same 4 themes as split-or-regret: clean, dark, retro, candy.

---

## Scope note

Intentionally left out of Level 1:
- Decision boundaries — a follow-up module
- Cross-validation — needs train/test split foundation first (split-or-regret covers that)
- Class imbalance — good misconception target but needs this foundation first
- Specific algorithms (kNN, trees, weights) — deliberately algorithm-agnostic
- Confidence / probability scores — distracts from the data → decision loop

Concepts that emerged naturally as follow-up ideas:
- 3rd alien class (Level 2 candidate)
- What happens when you give the model the wrong features
- What happens when training data is biased
