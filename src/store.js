export default class Store {
  constructor(initialState, defaultActions = {}) {
    this.prevState = null;
    this.state = initialState;
    this.listeners = new Set();
    this.registerActions(defaultActions);
  }

  getState() {
    return this.state;
  }

  getActions() {
    return this.actions;
  }

  updateState(reducerOsState) {
    this.prevState = this.state;
    this.state = {
      ...this.state,
      ...(typeof reducerOsState === 'function'
        ? reducerOsState(this.state)
        : reducerOsState)
    };

    this.listeners.forEach(listener => {
      listener(this.state, this.prevState);
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  registerActions(actions) {
    this.actions = Object.fromEntries(
      Object.entries(actions).map(([name, func]) => {
        return [
          name,
          (...args) => {
            this.updateState(func(...args)(this.state));
          }
        ];
      })
    );
  }
}
