const LOG_KEY = 'sor_log';

// ── Event schema ────────────────────────────────────────────────────────────
//
// Every entry written by Log.event() has the shape:
//   { ts: <epoch ms>, type: <string>, ...fields }
//
// Defined event types and their fields:
//
// session_start
//   theme          string   — 'clean' | 'dark' | 'retro' | 'candy'
//   modelSet       string   — 'greek' | 'planets' | 'animals' | ...
//   introShown     boolean  — true if the intro card was presented (not yet dismissed)
//   classARatio    number   — session A/B split, e.g. 0.62 means 62 % Class A
//
// collect_end  (fired when the student stops or caps collection for a phase)
//   phase          number   — 1 = first-train gate, 2 = full set
//   collected      number   — total blocks collected so far
//   collectedA     number   — Class A blocks collected
//   collectedB     number   — Class B blocks collected
//   collectDurationMs number — cumulative ms the Collect button was held this session
//
// train_run  (fired after each Train completes)
//   level          number   — game level (1, 2, 3)
//   runId          number   — 1-based run counter within the session
//   modelIdx       number   — 0-5
//   modelName      string
//   collected      number   — selected.size at train time
//   collectedA     number
//   collectedB     number
//   classARatio    number   — session-level A/B ratio
//   trainAccuracy  number   — 0-100 integer
//   isNewBest      boolean
//
// deploy_confirm  (fired when the student clicks Deploy)
//   level          number
//   modelIdx       number
//   modelName      string
//   trainAccuracy  number   — best training accuracy for this model (null if untrained)
//
// deploy_result  (fired when all test points have landed)
//   level          number
//   deployedModelIdx  number
//   deployedModelName string
//   deployAccuracy    number   — 0-100 integer, real-world result
//   bestModelIdx      number   — model with highest real-world accuracy
//   bestModelName     string
//   bestAccuracy      number
//   pickedBest        boolean  — deployedModelIdx === bestModelIdx
//   insightMessage    string   — full text of the insight banner shown to the student
//
// level_complete
//   level          number
//   durationMs     number   — ms from session_start to this event
//
// ────────────────────────────────────────────────────────────────────────────

const Log = {
  _events: null,

  _load() {
    if (this._events) return;
    try {
      const raw = localStorage.getItem(LOG_KEY);
      this._events = raw ? JSON.parse(raw) : [];
    } catch {
      this._events = [];
    }
  },

  // Generic append — all typed helpers go through here.
  event(type, data) {
    this._load();
    this._events.push({ ts: Date.now(), type, ...(data || {}) });
    localStorage.setItem(LOG_KEY, JSON.stringify(this._events));
  },

  // ── Typed helpers ──────────────────────────────────────────────────────────

  sessionStart({ theme, modelSet, introShown, classARatio }) {
    this.event('session_start', { theme, modelSet, introShown, classARatio });
  },

  collectEnd({ phase, collected, collectedA, collectedB, collectDurationMs }) {
    this.event('collect_end', { phase, collected, collectedA, collectedB, collectDurationMs });
  },

  trainRun({ level = 1, runId, modelIdx, modelName, collected, collectedA, collectedB,
             classARatio, trainAccuracy, isNewBest }) {
    this.event('train_run', { level, runId, modelIdx, modelName, collected, collectedA,
                              collectedB, classARatio, trainAccuracy, isNewBest });
  },

  deployConfirm({ level = 1, modelIdx, modelName, trainAccuracy }) {
    this.event('deploy_confirm', { level, modelIdx, modelName, trainAccuracy });
  },

  deployResult({ level = 1, deployedModelIdx, deployedModelName, deployAccuracy,
                 bestModelIdx, bestModelName, bestAccuracy, pickedBest, insightMessage }) {
    this.event('deploy_result', { level, deployedModelIdx, deployedModelName, deployAccuracy,
                                  bestModelIdx, bestModelName, bestAccuracy, pickedBest,
                                  insightMessage });
  },

  levelComplete({ level, durationMs }) {
    this.event('level_complete', { level, durationMs });
  },

  // ── Read / export ──────────────────────────────────────────────────────────

  getAll() {
    this._load();
    return [...this._events];
  },

  download(filename) {
    this._load();
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), events: this._events }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename || `split-or-regret_${new Date().toISOString().slice(0,10)}_log.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
