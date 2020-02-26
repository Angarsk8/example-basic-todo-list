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

  async subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async *listenState() {
    const self = this;
    let handler;
    let unsubscribe;

    const readableStream = new ReadableStream({
      start(controller) {
        handler = (newState, prevState) => {
          controller.enqueue([newState, prevState]);
        };
        unsubscribe = self.subscribe(handler);
      },
      cancel() {
        unsubscribe();
      }
    });

    const reader = readableStream.getReader();

    while(true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      yield value;
    }
  }

  registerActions(actions) {
    this.actions = Object.fromEntries(
      Object.entries(actions).map(([name, func]) => {
        return [
          name,
          (...args) => {
            const triggerAction = func(...args);
            const newStateOrPromise = triggerAction(
              this.state, this.updateState.bind(this)
            );

            if (
              newStateOrPromise.constructor === Promise ||
              newStateOrPromise.then
            ) {
              newStateOrPromise.then(newState => {
                if (newState) {
                  this.updateState(newState)
                }
              });
            } else {
              this.updateState(newStateOrPromise);
            }
          }
        ];
      })
    );
  }
}
