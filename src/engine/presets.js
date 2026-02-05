export const presets = [
  {
    id: 'basic-timeout',
    title: 'Basic setTimeout',
    description: 'See how setTimeout moves to Web APIs then task queue',
    code: `console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 1000);

console.log('End');`
  },

  {
    id: 'promise-vs-timeout',
    title: 'Promise vs setTimeout',
    description: 'Microtasks run before tasks',
    code: `console.log('Start');

setTimeout(() => {
  console.log('Timeout');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise');
});

console.log('End');`
  },

  {
    id: 'async-await',
    title: 'Async/Await',
    description: 'How async/await uses microtasks',
    code: `console.log('Start');

async function fetchData() {
  console.log('Fetching...');
  const data = await Promise.resolve('Data');
  console.log(data);
}

fetchData();

console.log('End');`
  },

  {
    id: 'raf-demo',
    title: 'requestAnimationFrame',
    description: 'rAF runs before paint',
    code: `console.log('Start');

requestAnimationFrame(() => {
  console.log('rAF callback');
});

setTimeout(() => {
  console.log('Timeout');
}, 0);

console.log('End');`
  },

  {
    id: 'microtask-storm',
    title: 'Microtask Storm',
    description: 'Microtasks can block rendering',
    code: `console.log('Start');

Promise.resolve().then(() => {
  console.log('Promise 1');
  Promise.resolve().then(() => {
    console.log('Promise 2');
    Promise.resolve().then(() => {
      console.log('Promise 3');
    });
  });
});

setTimeout(() => {
  console.log('Timeout');
}, 0);

console.log('End');`
  },

  {
    id: 'timer-ordering',
    title: 'Timer Ordering',
    description: 'Timers should respect their delay, not definition order',
    code: `console.log('Start');

setTimeout(() => console.log('1000ms'), 1000);
setTimeout(() => console.log('500ms'), 500);
setTimeout(() => console.log('10ms'), 10);
setTimeout(() => console.log('0ms'), 0);

console.log('End');`
  },

  {
    id: 'closures-and-scope',
    title: 'Closures & Scope',
    description: 'Functions remembering their lexical scope',
    code: `function createCounter(name) {
  let count = 0;
  return function() {
    count = count + 1;
    console.log(name + ': ' + count);
  };
}

const c1 = createCounter('A');
const c2 = createCounter('B');

c1(); // A: 1
c1(); // A: 2
c2(); // B: 1`
  },

  {
    id: 'return-values',
    title: 'Return Values',
    description: 'Functions returning values to callers',
    code: `function add(a, b) {
  return a + b;
}

function square(x) {
  return x * x;
}

const result = square(add(3, 4));
console.log('Result:', result);`
  },

  {
    id: 'async-mixed-priority',
    title: 'Mixed Priority (The Exam)',
    description: 'Promises, Timeouts, and RAF interaction',
    code: `console.log('1. Script Start');

setTimeout(() => console.log('8. Timeout 0ms'), 0);

requestAnimationFrame(() => console.log('6. RAF'));

Promise.resolve().then(() => {
  console.log('3. Promise 1');
  Promise.resolve().then(() => console.log('4. Promise 2'));
});

// Nested Logic
setTimeout(() => {
  console.log('9. Timeout 2 (Nested)');
  Promise.resolve().then(() => console.log('10. Microtask in properties'));
}, 0);

console.log('2. Script End');`
  },

  {
    id: 'async-sequential',
    title: 'Async/Await Sequential',
    description: 'Sequential async operations with await',
    code: `async function fetchData() {
  console.log('Start');
  
  await Promise.resolve();
  console.log('After first await');
  
  await Promise.resolve();
  console.log('After second await');
  
  await Promise.resolve();
  console.log('After third await');
  
  console.log('Done');
}

fetchData();
console.log('After function call');`
  },

  {
    id: 'promise-error',
    title: 'Promise Error Handling',
    description: 'Testing .catch() and .then() skipping',
    code: `console.log('Start');

// 1. Resolve -> .then (Runs)
Promise.resolve()
  .then(() => console.log('1. Success'));

// 2. Reject -> .then (Skip) -> .catch (Runs)
Promise.reject()
  .then(() => console.log('Skipped'))
  .catch(() => console.log('2. Caught Error'));

// 3. Resolve -> .catch (Skip)
Promise.resolve()
  .catch(() => console.log('Skipped Catch'));

console.log('End');`
  }
];