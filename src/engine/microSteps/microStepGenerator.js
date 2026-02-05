/**
 * Micro-step Generator
 * Generates execution steps from the AST
 */
import { enableInterceptor, disableInterceptor } from '../interceptor.js';

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

        // Enable interceptor to track user code
        enableInterceptor();

        // Walk through AST and create execution steps for MAIN THREAD only
        try {
            this.executor.walkAST(this.executor.ast);

            // Process deferred MICROTASKS first (higher priority than Task Queue)
            // 1. Process deferred MICROTASKS (Main Thread Microtasks)
            // Use for-loop to handle NESTED microtasks (added during iteration)
            const MAX_MICROTASKS = 1000; // Safety limit to prevent infinite loops
            let processedMicrotasks = 0;
            for (let i = 0; i < this.executor.deferredMicrotasks.length; i++) {
                // Safety check to prevent infinite loops
                if (processedMicrotasks >= MAX_MICROTASKS) {
                    console.warn('Microtask limit exceeded, stopping to prevent infinite loop');
                    break;
                }

                const deferred = this.executor.deferredMicrotasks[i];
                processedMicrotasks++;

                // Add to Microtask Queue
                this.executor.microSteps.push({
                    type: 'microtask_add',
                    data: { name: 'Promise.then', id: deferred.microtaskId },
                    duration: 300
                });

                // Remove from Microtask Queue
                this.executor.microSteps.push({ type: 'microtask_remove', duration: 200 });

                // Execute callback
                // Restore Scope if captured (for async/await continuations)
                const previousScope = this.executor.currentScope;
                if (deferred.scope) {
                    this.executor.currentScope = deferred.scope;
                }

                const callbackMicroSteps = this.executor.callbackParser.parse(deferred.callbackNode);
                this.executor.microSteps.push(...callbackMicroSteps);

                // Restore previous scope
                this.executor.currentScope = previousScope;
            }

            // 2. Process Animation Frames (Render Phase)
            if (this.executor.deferredRAFs && this.executor.deferredRAFs.length > 0) {
                this.executor.deferredRAFs.forEach(deferred => {
                    // Move RAF from Web API to RAF Queue
                    this.executor.microSteps.push({
                        type: 'webapi_remove', id: deferred.timerId, duration: 200
                    });

                    this.executor.microSteps.push({
                        type: 'rafqueue_add',
                        data: { name: 'requestAnimationFrame', id: deferred.timerId },
                        duration: 300
                    });

                    // Execute RAF
                    this.executor.microSteps.push({
                        type: 'rafqueue_remove', id: deferred.timerId, duration: 200
                    });

                    const callbackMicroSteps = this.executor.callbackParser.parse(deferred.callbackNode);
                    this.executor.microSteps.push(...callbackMicroSteps);
                });
                // Clear handled RAFs
                this.executor.deferredRAFs = [];
            }

            // 3. Process Tasks (with Microtask Checkpoints)
            const pendingTasks = [...this.executor.deferredCallbacks];
            // Sort by delay
            pendingTasks.sort((a, b) => a.delay - b.delay);
            this.executor.deferredCallbacks = [];

            pendingTasks.forEach(deferred => {
                // Move Task to Queue
                this.executor.microSteps.push({ type: 'webapi_remove', id: deferred.timerId, duration: 200 });
                this.executor.microSteps.push({
                    type: 'taskqueue_add',
                    data: { name: 'setTimeout callback', id: deferred.timerId },
                    duration: 300
                });

                // Execute Task
                this.executor.microSteps.push({ type: 'taskqueue_remove', id: deferred.timerId, duration: 200 });
                const callbackMicroSteps = this.executor.callbackParser.parse(deferred.callbackNode);
                this.executor.microSteps.push(...callbackMicroSteps);

                // Check for NEW Microtasks generated by this Task
                for (let i = processedMicrotasks; i < this.executor.deferredMicrotasks.length; i++) {
                    // Safety check to prevent infinite loops
                    if (processedMicrotasks >= MAX_MICROTASKS) {
                        console.warn('Microtask limit exceeded in task processing, stopping to prevent infinite loop');
                        break;
                    }

                    const mt = this.executor.deferredMicrotasks[i];
                    processedMicrotasks++;

                    this.executor.microSteps.push({
                        type: 'microtask_add',
                        data: { name: 'Promise.then', id: mt.microtaskId },
                        duration: 300
                    });
                    this.executor.microSteps.push({ type: 'microtask_remove', duration: 200 });
                    this.executor.microSteps.push(...this.executor.callbackParser.parse(mt.callbackNode));
                }
            });

            // Check for step limit (infinite loop protection)
            if (this.executor.steps.length > this.executor.MAX_STEPS) {
                disableInterceptor(); // Disable before returning error
                return { success: false, error: 'Code complexity exceeds limit' };
            }
        } catch (error) {
            console.error(error);
            disableInterceptor(); // Disable before returning error
            return { success: false, error: `Error analyzing code: ${error.message}` };
        }

        // Disable interceptor after code generation completes
        disableInterceptor();

        return { success: true, steps: this.executor.steps };
    }
}
