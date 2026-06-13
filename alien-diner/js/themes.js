// ── Theme definitions ─────────────────────────────────
const THEME_META = {
  diner:  { label: 'Diner',  sub: 'Retro 50s',      swatchClass: 'swatch-diner'  },
  space:  { label: 'Space',  sub: 'Deep Station',    swatchClass: 'swatch-space'  },
  alien:  { label: 'Alien',  sub: 'Bioluminescent',  swatchClass: 'swatch-alien'  },
  arcade: { label: 'Arcade', sub: 'Retro Cabinet',   swatchClass: 'swatch-arcade' },
};

// ── Theme API ─────────────────────────────────────────
const Themes = {
  apply(name) {
    const prev = State.get('theme');
    document.body.className = 'theme-' + (name || 'diner');
    State.set('theme', name || 'diner');
    if (prev && prev !== name) {
      State.set('themeChanges', (State.get('themeChanges') || 0) + 1);
      Log.themeChange(prev, name);
    }
  },

  fromState() {
    this.apply(State.get('theme') || 'diner');
  },

  isChosen() {
    return !!State.get('theme') && State.get('introSeen');
  },
};
