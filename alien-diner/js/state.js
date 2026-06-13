// ── Config ────────────────────────────────────────────
const INTERACTIVE_ID = 'alien-diner';
const STATE_KEY      = 'alien_diner_state';

// ── Defaults ──────────────────────────────────────────
const DEFAULT_STATE = {
  theme:       'clean',
  themeChanges: 0,
  startedAt:   null,
  introSeen:   false,
  levels: {
    1: { started: false, completed: false },
  },
  reflection: { completed: false, answers: {} },
};

// ── State API ─────────────────────────────────────────
const State = {
  _data: null,

  _load() {
    if (this._data) return;
    try {
      const raw = localStorage.getItem(STATE_KEY);
      this._data = raw
        ? JSON.parse(raw)
        : JSON.parse(JSON.stringify(DEFAULT_STATE));
    } catch {
      this._data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  },

  _save() {
    localStorage.setItem(STATE_KEY, JSON.stringify(this._data));
  },

  get(key) {
    this._load();
    return this._data[key];
  },

  set(key, value) {
    this._load();
    this._data[key] = value;
    this._save();
  },

  getLevel(n) {
    this._load();
    return { ...(this._data.levels[n] || {}) };
  },

  setLevel(n, updates) {
    this._load();
    this._data.levels[n] = { ...this._data.levels[n], ...updates };
    this._save();
  },

  // Stamp session start time once, on first visit.
  ensureStarted() {
    this._load();
    if (!this._data.startedAt) {
      this._data.startedAt = new Date().toISOString();
      this._save();
    }
  },

  reset() {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem('alien_diner_log');
    this._data = null;
  },
};
