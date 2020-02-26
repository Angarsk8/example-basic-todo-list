import {
  elementOpen as open,
  elementClose as close,
  text,
  patch
} from 'incremental-dom';

import Store from './store';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTodos() {
  const apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  return sleep(1500).then(() =>
    fetch(apiUrl).then(response => response.json())
  );
}

function App(props) {
  open('div');
    open('h2', 'subtitle', null);
      text('Hello ');
      open('span', 'username', ['contenteditable', 'true'],
        'onblur', (event) => {
          props.changeName(event.target.textContent);
        }
      );
        text(props.username);
      close('span');
    close('h2');
    Counter(props);
    open('p');
      text('These are your todos (click on them to change their status): ');
    close('p');
    open('button', 'fetch-todos', undefined,
      'onclick', props.fetchTodos,
      props.fetchingTodos ? 'disabled' : 'enabled', ''
    );
      text('Fetch todos!')
    close('button');
    TodoList(props);
    StatePanel(props);
  close('div');
}

function TodoList({ todos, fetchingTodos, toggleTodo }) {
  open('ul', 'todos', ['id', 'todos']);
    if (fetchingTodos) {
      text('Loading...');
    } else if (todos.length === 0) {
      text('Nothing to show :(');
    } else {
      todos.forEach(todo => {
        open('li', null, null,
          'class', todo.completed ? 'completed' : '',
          'onclick', toggleTodo.bind(null, todo.id)
        );
          open('span');
            if (todo.completed) {
              text('✓');
            } else {
              text('×');
            }
          close('span');
          text(' ');
          text(todo.title);
        close('li');
      });
    }
  close('ul');
}

function Counter({ count, increment, decrement }) {
  open('div');
    open('h3');
      text(`The count is currently at ${count}`);
    close('h3');
    open('button', 'decrement', null,
      'onclick', decrement
    );
      text('-');
    close('button');
    open('button', 'increment', null,
      'onclick', increment
    );
      text('+');
    close('button');
  close('div');
}

function StatePanel(props) {
  open('div', 'state-panel', ['id', 'state-panel']);
    open('pre');
      let state = {};
      Object.entries(props).forEach(([key, value]) => {
        if (typeof value !== 'function') {
          state[key] = value;
        }
      });
      text(JSON.stringify(state, null, 2));
    close('pre');
  close('div');
}

async function run(...asyncTasks) {
  return Promise.all(asyncTasks.map(task => task()));
}

export default async function init() {
  const initialState = {
    username: '@darmau5',
    count: 0,
    fetchingTodos: false,
    todos: []
  };

  const store = new Store(initialState);

  store.registerActions({
    decrement: () => ({ count }) => ({ count: count > 0 ? count - 1 : count }),
    increment: () => ({ count }) => ({ count: count + 1 }),
    changeName: username => () => ({ username }),
    toggleTodo: id => ({ todos }) => ({
      todos: todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    }),
    fetchTodos: () => async (_, updateState) => {
      updateState({ fetchingTodos: true });
      const todos = await getTodos();
      updateState({
        todos,
        fetchingTodos: false
      });
    }
  });

  const $container = document.querySelector('#app');

  function render(state = store.getState()) {
    patch($container, () => {
      // state + actions = props
      App({ ...state, ...store.getActions() });
    });
  }

  render();

  await run(
    async () => {
      for await (const [newState, prevState] of store.listenState()) {
        if (newState.username !== prevState.username) {
          document.title = `Halo liebe ${newState.username}!!!`;
        }
        render(newState);
      }
    },
    async () => { // start
      store.updateState({ fetchingTodos: true });
      const todos = await getTodos();
      store.updateState({ fetchingTodos: false, todos });
    }
  );
}
