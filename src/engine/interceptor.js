/**
 * Interceptor for Web APIs
 * Wraps native browser APIs to track their usage in the visualizer
 */

export function createInterceptor(store) {
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalPromise = window.Promise;

    return {
        /**
         * Intercept setTimeout
         */
        setTimeout: (callback, delay, ...args) => {
            const id = `timer_${crypto.randomUUID()}`;

            // Add to Web APIs
            store.addToWebAPIs({
                id,
                type: 'setTimeout',
                delay: delay || 0,
            });

            // Schedule the actual timeout
            const timerId = originalSetTimeout(() => {
                // Remove from Web APIs
                store.removeFromWebAPIs(id);

                // Add callback to task queue
                store.addToTaskQueue({
                    name: 'setTimeout callback',
                    id,
                });

                // Execute callback
                callback(...args);

                // Remove from task queue after execution
                originalSetTimeout(() => {
                    store.removeFromTaskQueue(id);
                }, 100);
            }, delay || 0);

            return timerId;
        },

        /**
         * Intercept setInterval
         */
        setInterval: (callback, delay, ...args) => {
            const id = `interval_${crypto.randomUUID()}`;

            // Add to Web APIs
            store.addToWebAPIs({
                id,
                type: 'setInterval',
                delay: delay || 0,
            });

            // Schedule the actual interval
            const intervalId = originalSetInterval(() => {
                // Add callback to task queue
                store.addToTaskQueue({
                    name: 'setInterval callback',
                    id,
                });

                // Execute callback
                callback(...args);

                // Remove from task queue after execution
                originalSetTimeout(() => {
                    store.removeFromTaskQueue(id);
                }, 100);
            }, delay || 0);

            return intervalId;
        },

        /**
         * Intercept requestAnimationFrame
         */
        requestAnimationFrame: (callback) => {
            const id = `raf_${crypto.randomUUID()}`;

            // Add to RAF queue
            store.addToRAFQueue({
                name: 'RAF callback',
                id,
            });

            // Schedule the actual RAF
            const rafId = originalRequestAnimationFrame((timestamp) => {
                // Execute callback
                callback(timestamp);

                // Remove from RAF queue after execution
                originalSetTimeout(() => {
                    store.removeFromRAFQueue(id);
                }, 100);
            });

            return rafId;
        },

        /**
         * Intercept Promise
         */
        Promise: class extends originalPromise {
            then(onFulfilled, onRejected) {
                // Add to microtask queue
                store.addToMicrotaskQueue({
                    name: 'Promise.then',
                });

                return super.then(
                    (value) => {
                        // Remove from microtask queue
                        originalSetTimeout(() => {
                            store.removeFromMicrotaskQueue();
                        }, 50);

                        return onFulfilled ? onFulfilled(value) : value;
                    },
                    onRejected
                );
            }

            catch(onRejected) {
                // Add to microtask queue
                store.addToMicrotaskQueue({
                    name: 'Promise.catch',
                });

                return super.catch((error) => {
                    // Remove from microtask queue
                    originalSetTimeout(() => {
                        store.removeFromMicrotaskQueue();
                    }, 50);

                    return onRejected ? onRejected(error) : Promise.reject(error);
                });
            }
        },

        /**
         * Intercept console.log
         */
        console: {
            log: (...args) => {
                const message = args.map(arg => String(arg)).join(' ');
                store.addToConsole(message);
                // Use original console.log to avoid recursion
                const originalConsoleLog = window.__originalAPIs?.consoleLog || console.log;
                originalConsoleLog.apply(console, args);
            },
        },
    };
}

/**
 * Install interceptors globally
 */
export function installInterceptors(store) {
    // Save originals BEFORE any interception
    if (!window.__originalAPIs) {
        window.__originalAPIs = {
            setTimeout: window.setTimeout,
            setInterval: window.setInterval,
            requestAnimationFrame: window.requestAnimationFrame,
            Promise: window.Promise,
            consoleLog: console.log,
        };
    }

    const interceptor = createInterceptor(store);

    window.setTimeout = interceptor.setTimeout;
    window.setInterval = interceptor.setInterval;
    window.requestAnimationFrame = interceptor.requestAnimationFrame;
    window.Promise = interceptor.Promise;
    window.console.log = interceptor.console.log;
}

/**
 * Restore original APIs
 */
export function restoreOriginalAPIs() {
    if (window.__originalAPIs) {
        window.setTimeout = window.__originalAPIs.setTimeout;
        window.setInterval = window.__originalAPIs.setInterval;
        window.requestAnimationFrame = window.__originalAPIs.requestAnimationFrame;
        window.Promise = window.__originalAPIs.Promise;
        console.log = window.__originalAPIs.consoleLog;
    }
}
