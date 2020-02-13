import { createElement as h } from './dom';
import Store from './store';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTodos() {
  const apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  return sleep(1000).then(() =>
    fetch(apiUrl).then(response => response.json())
  );
}

function App(props) {
  return h('div', undefined, [
    h('h2', undefined, [
      'Hello ',
      h(
        'span',
        {
          contenteditable: true,
          onBlur: (event) => {
            props.changeName(event.target.textContent);
          }
        },
        `${props.username}`
      )
    ]),
    h('p', undefined, 'These are your todos: '),
    Counter(props),
    TodoList(props)
  ]);
}

function TodoList({ todos, toggleTodo }) {
  return h(
    'ul',
    { id: 'todos' },
    todos.length === 0
      ? 'Loading...'
      : todos.map(({ id, title, completed }) =>
          h(
            'li',
            {
              class: completed ? 'completed' : '',
              onClick: () => {
                toggleTodo(id);
              }
            },
            title
          )
        )
  );
}

function Counter({ count, increment, decrement }) {
  return h('div', undefined, [
    h('h3', undefined, `The count is currently at ${count}`),
    h('button', { onClick: decrement }, '-'),
    h('button', { onClick: increment }, '+')
  ]);
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
  let $App = App({ ...store.getState(), ...store.getActions() });
  let $PreviosApp;

  $container.appendChild($App);

  function render(state = store.getState()) {
    $PreviosApp = $App;
    $App = App({ ...state, ...store.getActions() });
    $container.replaceChild($App, $PreviosApp);
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
