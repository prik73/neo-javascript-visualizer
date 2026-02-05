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
    handlePromiseChain(promiseNode, thenCallback) {
        const microtaskId = this.executor.microtaskIdCounter++;
        const line = promiseNode.loc?.start.line || null;

        // Highlight Promise.resolve() line
        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        // Push Promise.resolve() to CallStack
        this.executor.microSteps.push({
            type: 'callstack_push',
            name: 'Promise.resolve()',
            duration: 300
        });

        // Pop Promise.resolve() from CallStack
        this.executor.microSteps.push({
            type: 'callstack_pop',
            duration: 300
        });

        // DEFER the microtask
        this.executor.deferredMicrotasks.push({
            microtaskId,
            callbackNode: thenCallback,
            type: 'Promise.then'
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
