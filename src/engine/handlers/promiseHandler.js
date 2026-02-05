/**
 * Promise Handler
 * Handles Promise.resolve().then() with Microtask Queue
 */
export class PromiseHandler {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Handle Promise.resolve().then(callback) chain
     */
    handlePromiseChain(promiseNode, callback, method = 'then') {
        const microtaskId = this.executor.microtaskIdCounter++;
        const line = promiseNode.loc?.start.line || null;

        // Determine Promise State
        // If promiseNode is CallExpression (Promise.resolve()), check callee name.
        // If promiseNode is MemberExpression (chaining), this is complex.
        // SIMPLIFICATION: We check the IMMEDIATE parent call.

        let promiseState = 'fulfilled'; // Default

        // Deep Traversal to find the Root Promise Call (Chain Start)
        let currentNode = promiseNode;
        let depth = 0;

        while (currentNode && depth < 20) {
            if (currentNode.callee) {
                const calleeName = this.executor.getCalleeName(currentNode.callee);

                // Check if we hit the root Promise creation
                if (calleeName === 'Promise.reject') {
                    promiseState = 'rejected';
                    break;
                } else if (calleeName === 'Promise.resolve' || calleeName === 'Promise.all') {
                    promiseState = 'fulfilled';
                    break;
                }

                // Move up chain (e.g. from .then() to .then().object)
                if (currentNode.callee.object) {
                    currentNode = currentNode.callee.object;
                } else {
                    break; // End of chain
                }
            } else {
                break;
            }
            depth++;
        }

        // Evaluate arguments of the promise call
        if (promiseNode.arguments && promiseNode.arguments.length > 0) {
            promiseNode.arguments.forEach(arg => this.executor.evaluate(arg));
        }

        // Logic:
        // Fulfilled -> Runs .then, Skips .catch
        // Rejected -> Skips .then, Runs .catch

        const shouldRun = (promiseState === 'fulfilled' && method === 'then') ||
            (promiseState === 'rejected' && method === 'catch');

        if (!shouldRun) {
            // Skip this handler
            return;
        }

        // Highlight line
        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        // Push/Pop Stack
        this.executor.microSteps.push({
            type: 'callstack_push',
            name: `Promise.${method}()`, // 'then' or 'catch'
            duration: 300
        });
        this.executor.microSteps.push({
            type: 'callstack_pop',
            duration: 300
        });

        // DEFER the microtask
        this.executor.deferredMicrotasks.push({
            microtaskId,
            callbackNode: callback,
            type: `Promise.${method}`,
            state: promiseState
        });

        // Keep old step for compatibility
        this.executor.steps.push({
            type: 'promise',
            microtaskId,
            line: line,
            action: () => { },
        });
    }

    /**
     * Handle Promise.resolve() (without .then())
     */
    handlePromiseResolve(node) {
        const microtaskId = this.executor.microtaskIdCounter++;
        const line = node.loc?.start.line || null;

        // Evaluate arguments (Essential for Promise.all([...]) and Promise.resolve(fn()))
        if (node.arguments && node.arguments.length > 0) {
            node.arguments.forEach(arg => this.executor.evaluate(arg));
        }

        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        this.executor.microSteps.push({
            type: 'callstack_push',
            name: 'Promise.resolve()',
            duration: 300
        });

        this.executor.microSteps.push({
            type: 'callstack_pop',
            duration: 300
        });

        this.executor.deferredMicrotasks.push({
            microtaskId,
            callbackNode: null,
            type: 'Promise.then',
            promiseNode: node
        });

        this.executor.steps.push({
            type: 'promise',
            microtaskId,
            line: line,
            action: () => { },
        });
    }
}
