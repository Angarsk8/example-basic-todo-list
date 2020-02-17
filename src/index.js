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
  return sleep(3000).then(() =>
    fetch(apiUrl).then(response => response.json())
  );
}

function App(props) {
  open('div');
    open('h2', 'subtitle',
      ['contenteditable', 'true'],
      'onblur', (event) => {
        props.changeName(event.target.textContent);
      }
    );
      text(props.username);
    close('h2');
    open('p');
      text('These are your todos');
    close('p');
    Counter(props);
    TodoList(props);
    StatePanel(props);
  close('div');
}

function TodoList({ todos, toggleTodo }) {
  open('ul', 'todos', ['id', 'todos']);
    if (todos.length === 0) {
      text('Loading...');
    } else {
      todos.forEach(todo => {
        open('li', null, null,
          'class', todo.completed ? 'completed' : '',
          'onclick', toggleTodo.bind(null, todo.id)
        );
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

export default function init() {
  const initialState = { username: '@darmau5', count: 0, todos: [] };
  const store = new Store(initialState);

  store.registerActions({
    decrement: () => ({ count }) => ({ count: count > 0 ? count - 1 : count }),
    increment: () => ({ count }) => ({ count: count + 1 }),
    changeName: username => () => ({ username }),
    toggleTodo: id => ({ todos }) => ({
      todos: todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    })
  });

  const $container = document.querySelector('#app');

  function render(state = store.getState()) {
    patch($container, () => {
      // state + actions = props
      App({ ...state, ...store.getActions() });
    });
  }

  render();

  store.subscribe((newState, prevState) => {
    if (newState.username !== prevState.username) {
      document.title = `Hällo liebe ${newState.username}!!!`;
    }
    render(newState);
  });

  getTodos().then(todos => store.updateState(() => ({ todos })));
}
