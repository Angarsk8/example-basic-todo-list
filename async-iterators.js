function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function * on(eventName, $element) {
  let handler = () => {};
  const readableStream = new ReadableStream({
    start(controller) {
      handler = event => controller.enqueue(event);
      $element.addEventListener(eventName, handler);
    },
    cancel() {
      $element.removeEventListener(eventName, handler);
    }
  });

  const reader = readableStream.getReader();

  while (true) {
    const { done, value: event } = await reader.read();

    if (done) {
      return;
    }

    yield event;
  }
}

async function * distinct(asyncGenerator, selector = to => to) {
  let previous;
  for await (const value of asyncGenerator) {
    const selectedValue = selector(value);
    if (selectedValue !== previous) {
      yield value;
      previous = selectedValue;
    }
  }
}

async function * delay(asyncGenerator, ms) {
  for await (const value of asyncGenerator) {
    await new Promise(resolve => setTimeout(resolve, ms));
    yield value;
  }
}

async function * zip(...asyncGenerators) {
  while(true) {
    const results = await Promise.all(
      asyncGenerators.map(asyncGen => asyncGen.next())
    );

    const zippedValues = results.map(result => result.value);

    if (results.some(result => result.done)) {
      return zippedValues;
    }

    yield zippedValues;
  }
}

async function * map(asyncGenerator, mapper) {
  for await (const value of asyncGenerator) {
    yield mapper(value);
  }
}

async function * filter(asyncGenerator, predicate) {
  for await (const value of asyncGenerator) {
    if (predicate(value)) {
      yield value;
    }
  }
}

function formatLog(text) {
  return `[${new Date().toLocaleTimeString()}] User clicked on button with text: ${text}`;
}

function logEvent(message) {
  const $logs = document.querySelector('pre');
  const $log = document.createElement('div');
  $log.textContent = formatLog(message);
  $logs.appendChild($log);
}

async function onClickButton() {
  const $button = document.querySelector('button');
  for await (const event of delay(on('click', $button), 100)) {
    logEvent(event.target.textContent);
  }
}

async function * onEnter($input) {
  yield* filter(
    on('keyup', $input),
    event => event.key.toUpperCase() === 'ENTER'
  );
}

async function onEnterInput() {
  const $input = document.querySelector('input');
  for await (const event of distinct(
    onEnter($input),
    event => event.target.value
  )) {
    logEvent(event.target.value);
    setTimeout(() => {
      event.target.value = '';
    }, 0);
  }
}

async function run() {
  await Promise.all([
    onClickButton(),
    onEnterInput(),
    (async () => {
      for await (const event of on('click', document.querySelector('button'))) {
        console.log('button clicked!!!', event.target.type);
      }
    })(),
    (async () => {
      /*
      Can't wait until I could finally do this in JS (pipeline operator + asyc/await + iterators):
      ```js
        const asyncProducer = [
          on('click', document.querySelector('button')),
          onEnter(document.querySelector('input'))
        ]
        |> zip(...?)
        |> map(?, events => events.map(event => event.target.type));

        for await (const targets of asyncProducer) { ... }
      ```
      */
      for await (const targets of map(
        zip(
          on('click', document.querySelector('button')),
          onEnter(document.querySelector('input'))
        ),
        events => events.map(event => event.target.type)
      )) {
        logEvent('Event targets: ' + targets);
      }
    })()
  ]);
}

run()
  .then(console.log)
  .catch(console.error);
