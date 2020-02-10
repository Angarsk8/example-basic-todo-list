function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTodos() {
  const apiUrl = 'https://jsonplaceholder.typicode.com/todos';
  return sleep(3000).then(() => fetch(apiUrl).then(response => response.json()));
}

function renderTodos(todos) {
  const $ul = document.querySelector('#contenedor > ul');
  $ul.textContent = '';

  for (const todo of todos) {
    const $li = document.createElement('li');
    $li.textContent = todo.title;

    if (todo.completed) {
      $li.classList.add('completed');
    }

    $li.addEventListener('click', () => {
      if ($li.classList.contains('completed')) {
        $li.classList.remove('completed');
      } else {
        $li.classList.add('completed');
      }
    });

    $ul.appendChild($li);
  }
}

function main() {
  getTodos().then(renderTodos);
}

main();
