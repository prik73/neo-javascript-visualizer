/**
 * Micro-step Generator
 * Generates execution steps from the AST
 */
export class MicroStepGenerator {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Generate execution steps from the AST
     */
    generate(code) {
        const parseResult = this.executor.parseCode(code);
        if (!parseResult.success) {
            return { success: false, error: parseResult.error };
        }

        this.executor.steps = [];
        this.executor.microSteps = [];
        this.executor.deferredCallbacks = [];  // Clear deferred callbacks
        this.executor.deferredMicrotasks = [];  // Clear deferred microtasks
        this.executor.currentStep = 0;
        this.executor.currentMicroStep = 0;

        // Walk through AST and create execution steps for MAIN THREAD only
        try {
            this.executor.walkAST(this.executor.ast);

            // Process deferred MICROTASKS first (higher priority than Task Queue)
            this.executor.deferredMicrotasks.forEach(deferred => {
                // Add to Microtask Queue
                this.executor.microSteps.push({
                    type: 'microtask_add',
                    data: {
                        name: 'Promise.then',
                        id: deferred.microtaskId
                    },
                    duration: 300
                });

                // Remove from Microtask Queue (picked up immediately)
                this.executor.microSteps.push({
                    type: 'microtask_remove',
                    duration: 200
                });

                // Execute callback
                const callbackMicroSteps = this.executor.callbackParser.parse(deferred.callbackNode);
                this.executor.microSteps.push(...callbackMicroSteps);
            });

            // NOW process deferred callbacks (async code - Task Queue)
            this.executor.deferredCallbacks.forEach(deferred => {
                // Move from Web APIs to Task Queue
                this.executor.microSteps.push({
                    type: 'webapi_remove',
                    id: deferred.timerId,
                    duration: 200
                });

                this.executor.microSteps.push({
                    type: 'taskqueue_add',
                    data: {
                        name: 'setTimeout callback',
                        id: deferred.timerId
                    },
                    duration: 300
                });

                // Remove from Task Queue (event loop picks it up)
                this.executor.microSteps.push({
                    type: 'taskqueue_remove',
                    id: deferred.timerId,
                    duration: 200
                });

                // NOW execute callback (push to CallStack, execute, pop)
                const callbackMicroSteps = this.executor.callbackParser.parse(deferred.callbackNode);
                this.executor.microSteps.push(...callbackMicroSteps);
            });

            // Check for step limit (infinite loop protection)
            if (this.executor.steps.length > this.executor.MAX_STEPS) {
                return { success: false, error: 'Code complexity exceeds limit' };
            }
        } catch (error) {
            console.error(error);
            return { success: false, error: 'Error analyzing code' };
        }

        return { success: true, steps: this.executor.steps };
    }
}
