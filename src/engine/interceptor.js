/**
 * Interceptor for Web APIs
 * Wraps native browser APIs to track their usage in the visualizer
 */

export function createInterceptor(store) {
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalPromise = window.Promise;

    // Flag to prevent intercepting our own internal calls
    let isInternalCall = false;

    // Flag to control when interceptor is active (only during user code execution)
    let isEnabled = false;

    const interceptor = {
        // Method to enable/disable the interceptor
        setEnabled(enabled) {
            isEnabled = enabled;
        },
        /**
         * Intercept setTimeout
         */
        setTimeout: (callback, delay, ...args) => {
            // Don't intercept if disabled or internal call
            if (!isEnabled || isInternalCall) {
                return originalSetTimeout(callback, delay, ...args);
            }

            // Filter out common development environment timers (Vite HMR, React DevTools)
            // These are typically 250ms or 2000ms intervals
            const isDevelopmentTimer = (delay === 250 || delay === 2000) &&
                (callback.toString().includes('__vite') ||
                    callback.toString().includes('react-devtools') ||
                    callback.toString().length > 500); // Large minified callbacks

            if (isDevelopmentTimer) {
                return originalSetTimeout(callback, delay, ...args);
            }

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

                // Remove from task queue after execution (use internal flag)
                isInternalCall = true;
                originalSetTimeout(() => {
                    store.removeFromTaskQueue(id);
                    isInternalCall = false;
                }, 100);
            }, delay || 0);

            return timerId;
        },

        /**
         * Intercept setInterval
         */
        setInterval: (callback, delay, ...args) => {
            // Don't intercept if disabled or internal call
            if (!isEnabled || isInternalCall) {
                return originalSetInterval(callback, delay, ...args);
            }

            // Filter out development environment intervals
            const isDevelopmentTimer = (delay === 250 || delay === 2000) &&
                (callback.toString().includes('__vite') ||
                    callback.toString().includes('react-devtools') ||
                    callback.toString().length > 500);

            if (isDevelopmentTimer) {
                return originalSetInterval(callback, delay, ...args);
            }

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

                // Remove from task queue after execution (use internal flag)
                isInternalCall = true;
                originalSetTimeout(() => {
                    store.removeFromTaskQueue(id);
                    isInternalCall = false;
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
                        // Remove from microtask queue (use internal flag)
                        isInternalCall = true;
                        originalSetTimeout(() => {
                            store.removeFromMicrotaskQueue();
                            isInternalCall = false;
                        }, 50);

                        return onFulfilled ? onFulfilled(value) : value;
                    },
                    (error) => {
                        // Remove from microtask queue on error (use internal flag)
                        isInternalCall = true;
                        originalSetTimeout(() => {
                            store.removeFromMicrotaskQueue();
                            isInternalCall = false;
                        }, 50);

                        return onRejected ? onRejected(error) : Promise.reject(error);
                    }
                );
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

    return interceptor;
}

/**
 * Install interceptors globally
 */
let interceptorInstance = null;

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

    interceptorInstance = createInterceptor(store);

    window.setTimeout = interceptorInstance.setTimeout;
    window.setInterval = interceptorInstance.setInterval;
    window.requestAnimationFrame = interceptorInstance.requestAnimationFrame;
    window.Promise = interceptorInstance.Promise;
    window.console.log = interceptorInstance.console.log;
}

/**
 * Enable interceptor (start tracking user code)
 */
export function enableInterceptor() {
    if (interceptorInstance) {
        interceptorInstance.setEnabled(true);
    }
}

/**
 * Disable interceptor (stop tracking, allow background timers)
 */
export function disableInterceptor() {
    if (interceptorInstance) {
        interceptorInstance.setEnabled(false);
    }
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
