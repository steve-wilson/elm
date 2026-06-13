// ── Config ────────────────────────────────────────────
const LOG_KEY = 'alien_diner_log';

// ── Event types and fields ────────────────────────────
//
// session_start  { theme }
// intro_dismissed
// training_complete  { examples_seen: number }
// rush_start
// customer_served  { alien_id, true_label, student_answer, model_answer,
//                    outcome: 'correct'|'wrong'|'miss', reaction_time_ms }
// rush_complete  { student_accuracy, model_accuracy, agreement_rate }
// checkin  { level, rating: 'great'|'okay'|'struggling', feedback: string }
// reflection_answer  { slug, answer }
// quiz_answer  { slug, answer, correct }
// theme_change  { from, to }
// advanced_enter
// ─────────────────────────────────────────────────────

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

  event(type, data) {
    this._load();
    this._events.push({ ts: Date.now(), type, ...(data || {}) });
    localStorage.setItem(LOG_KEY, JSON.stringify(this._events));
  },

  // ── Typed helpers ─────────────────────────────────────

  sessionStart(theme)           { this.event('session_start', { theme }); },
  introDismissed()              { this.event('intro_dismissed'); },
  trainingComplete(examplesSeen){ this.event('training_complete', { examples_seen: examplesSeen }); },
  rushStart()                   { this.event('rush_start'); },
  themeChange(from, to)         { this.event('theme_change', { from, to }); },
  advancedEnter()               { this.event('advanced_enter'); },

  customerServed({ alienId, trueLabel, studentAnswer, modelAnswer, outcome, reactionTimeMs }) {
    this.event('customer_served', {
      alien_id: alienId, true_label: trueLabel,
      student_answer: studentAnswer, model_answer: modelAnswer,
      outcome, reaction_time_ms: reactionTimeMs,
    });
  },

  rushComplete({ studentAccuracy, modelAccuracy, agreementRate }) {
    this.event('rush_complete', {
      student_accuracy: studentAccuracy,
      model_accuracy:   modelAccuracy,
      agreement_rate:   agreementRate,
    });
  },

  checkin(level, rating, feedback) {
    this.event('checkin', { level, rating, feedback: feedback || '' });
  },

  reflectionAnswer(slug, answer) {
    this.event('reflection_answer', { slug, answer });
  },

  quizAnswer(slug, answer, correct) {
    this.event('quiz_answer', { slug, answer, correct });
  },

  // ── Assembly + export ─────────────────────────────────

  assemble() {
    this._load();
    const state    = State.get;          // shorthand — callers use State directly
    const started  = State.get('startedAt');
    const now      = new Date().toISOString();
    const durationS = started
      ? Math.round((Date.now() - new Date(started).getTime()) / 1000)
      : 0;

    // Derive per-level summary from events
    const served = this._events.filter(e => e.type === 'customer_served');
    const rushDone = this._events.find(e => e.type === 'rush_complete');

    // Reflection / quiz answers from events
    const reflectionAnswers = {};
    const quizAnswers = {};
    this._events.filter(e => e.type === 'reflection_answer')
      .forEach(e => { reflectionAnswers[e.slug] = e.answer; });
    this._events.filter(e => e.type === 'quiz_answer')
      .forEach(e => { quizAnswers[e.slug] = { answer: e.answer, correct: e.correct }; });

    // Leaderboard
    const reflectionDepth = Object.values(reflectionAnswers)
      .reduce((sum, a) => sum + (typeof a === 'string' ? a.length : 0), 0);
    const explorationScore = this._events.filter(e => e.type === 'advanced_enter').length > 0 ? 10 : 0;
    const accuracyScore    = rushDone ? Math.round(rushDone.student_accuracy * 100) : 0;
    const totalScore       = explorationScore + Math.min(reflectionDepth, 500) + accuracyScore;

    return {
      schema_version:    '1.0',
      interactive_id:    INTERACTIVE_ID,
      interactive_title: 'Alien Diner',
      session: {
        started_at:          started || now,
        completed_at:        now,
        duration_seconds:    durationS,
        theme_chosen:        State.get('theme'),
        theme_changes:       State.get('themeChanges') || 0,
        completed_all_steps: State.get('reflection')?.completed || false,
      },
      events: [...this._events],
      per_level: {
        level1: {
          training_examples_shown:   10,
          queue_length:              10,
          served:                    served,
          student_accuracy:          rushDone?.student_accuracy  ?? null,
          model_accuracy:            rushDone?.model_accuracy    ?? null,
          agreement_rate:            rushDone?.agreement_rate    ?? null,
          checkin: (() => {
            const c = this._events.find(e => e.type === 'checkin' && e.level === 1);
            return c ? { rating: c.rating, feedback: c.feedback } : null;
          })(),
        },
      },
      reflection_answers: reflectionAnswers,
      quiz_answers:       quizAnswers,
      leaderboard: {
        exploration_score:      explorationScore,
        reflection_depth_score: Math.min(reflectionDepth, 500),
        accuracy_score:         accuracyScore,
        total_score:            totalScore,
      },
    };
  },

  download() {
    const log      = this.assemble();
    const date     = new Date().toISOString().slice(0, 10);
    const filename = `${INTERACTIVE_ID}_${date}_log.json`;
    const blob     = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};
