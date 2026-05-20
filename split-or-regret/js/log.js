const LOG_KEY = 'sor_log';

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
