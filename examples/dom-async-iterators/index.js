function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function on(eventName, $element) {
  let handler;
  const readableStream = new ReadableStream({
    start(controller) {
      handler = event => controller.enqueue(event);
      $element.addEventListener(eventName, handler);
    },
    cancel(reason) {
      console.log('Radable stream has been cancelled: ', reason);
      $element.removeEventListener(eventName, handler);
    }
  });

  const source = readableStream.getReader();

  return {
    source,
    next() {
      return source.read();
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}

async function * distinct(asyncIterator, selector = x => x) {
  let previous;
  for await (const value of asyncIterator) {
    const selectedValue = selector(value);
    if (selectedValue !== previous) {
      yield value;
      previous = selectedValue;
    }
  }
}

async function * delay(asyncIterator, ms) {
  for await (const value of asyncIterator) {
    await sleep(ms);
    yield value;
  }
}

async function * zip(...asyncIterators) {
  while(true) {
    const results = await Promise.all(
      asyncIterators.map(asyncGen => asyncGen.next())
    );

    const zippedValues = results.map(result => result.value);

    if (results.some(result => result.done)) {
      return zippedValues;
    }

    yield zippedValues;
  }
}

async function * map(asyncIterator, mapper) {
  for await (const value of asyncIterator) {
    yield mapper(value);
  }
}

async function * filter(asyncIterator, predicate) {
  for await (const value of asyncIterator) {
    if (predicate(value)) {
      yield value;
    }
  }
}

async function *concat(...asyncIterators) {
  for (const asyncIterator of asyncIterators) {
    yield* asyncIterator;
  }
}

function formatLog(tag, text) {
  return `[${new Date().toLocaleTimeString()}][${tag}]: ${text}`;
}

function logEvent(tag, message) {
  const $logs = document.querySelector('pre');
  const $log = document.createElement('div');
  $log.textContent = formatLog(tag, message);
  $logs.appendChild($log);
}

async function * merge(...asyncIterators) {
  const queueNext = async (element) => {
    element.result = null;
    element.result = await element.iterator.next();
    return element;
  };

  const sources = new Map(asyncIterators.map(asyncIterator => [
    asyncIterator,
    queueNext({
      key: asyncIterator,
      iterator:  asyncIterator[Symbol.asyncIterator]()
    })
  ]));

  while (sources.size) {
    const winner = await Promise.race(sources.values());
    if (winner.result.done) {
      sources.delete(winner.key);
    } else {
      const { value } = winner.result;
      sources.set(winner.key, queueNext(winner));
      yield value;
    }
  }
}

async function * onEnter($input) {
  yield* filter(
    on('keyup', $input),
    event => event.key.toUpperCase() === 'ENTER'
  );
}

async function onClickButton() {
  const $button = document.querySelector('button');
  for await (const event of delay(on('click', $button), 100)) {
    logEvent('onClickButton', event.target.textContent);
  }
}

async function onEnterInput() {
  const $input = document.querySelector('input');
  for await (const event of distinct(
    onEnter($input),
    event => event.target.value
  )) {
    logEvent('onEnterInput', event.target.value);
    setTimeout(() => {
      event.target.value = '';
    }, 0);
  }
}

async function run(...asyncTasks) {
  return Promise.all(asyncTasks.map(task => task()));
}

async function main() {
  await run(
    onClickButton,
    onEnterInput,
    async () => {
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
        logEvent('zip(onClick + onEnter) |> map |> get(:type)', targets);
      }
    },
    async () => {
      /*
      ```js
        const events = [
          on('click', document.querySelector('button')) |> delay(?, 100),
          onEnter(document.querySelector('input')),
        ]
        |> merge(...?);

        for await (const event of events) { ... }
      ```
      */
      for await (
        const event of merge(
          delay(
            on('click', document.querySelector('button')),
            100
          ),
          onEnter(document.querySelector('input')),
        )
      ) {
        switch (event.constructor) {
          case MouseEvent:
            logEvent('merge(onClick + onEnter) |> :click', event.target.textContent);
            break;
          case KeyboardEvent:
            logEvent('merge(onClick + onEnter) |> :enter', event.target.value);
            setTimeout(() => {
              event.target.value = '';
            }, 0);
            break;
          default:
            console.log('Unknown event:', event);
            break;
        }
      }
    }
  );
}

main()
  .catch(console.error);
