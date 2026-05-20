const Themes = {
  apply(name) {
    document.body.className = 'theme-' + (name || 'clean');
  },

  fromState() {
    this.apply(State.get('theme') || 'clean');
  },
};
