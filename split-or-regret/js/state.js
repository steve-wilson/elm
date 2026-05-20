const STATE_KEY = 'sor_state';

const DEFAULT_STATE = {
  theme: 'clean',
  modelSet: null,
  startedAt: null,
  levels: {
    1: {
      started: false, completed: false,
      bestAccuracy: 0, runCount: 0,
      modelsUnlocked: false, modelsTried: [],
    },
    2: {
      started: false, completed: false,
      bestAccuracy: 0, runCount: 0,
      testPeekCount: 0,
    },
    3: {
      started: false, completed: false,
      bestAccuracy: 0, runCount: 0,
      testRevealed: false,
    },
  },
  reflection: { completed: false, answers: {} },
};

const State = {
  _data: null,

  _load() {
    if (this._data) return;
    try {
      const raw = localStorage.getItem(STATE_KEY);
      this._data = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_STATE));
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

  reset() {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem('sor_log');
    this._data = null;
  },
};
