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
];