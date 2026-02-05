import useVisualizerStore from '../../store/visualizerStore';

/**
 * Micro-step Executor
 * Handles the execution of individual micro-steps (animations, state updates)
 */
export class MicroStepExecutor {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Helper to create a delay
     */
    delay(ms) {
        const nativePromise = window.__originalAPIs?.Promise || Promise;
        const nativeSetTimeout = window.__originalAPIs?.setTimeout || setTimeout;
        return new nativePromise(resolve => nativeSetTimeout(resolve, ms));
    }

    /**
     * Execute a single micro-step
     */
    async executeMicroStep(microStep, speedMultiplier = 1) {
        const store = useVisualizerStore.getState();
        const duration = (microStep.duration || 100) * speedMultiplier;

        switch (microStep.type) {
            case 'highlight':
                store.setCurrentLine(microStep.line);
                await this.delay(duration);
                break;

            case 'callstack_push':
                store.pushToCallStack({ name: microStep.name });
                await this.delay(duration);
                break;

            case 'callstack_pop':
                store.popFromCallStack();
                await this.delay(duration);
                break;

            case 'console_output':
                store.addToConsole(microStep.message);
                await this.delay(duration);
                break;

            case 'webapi_add':
                store.addToWebAPIs(microStep.data);
                await this.delay(duration);
                break;

            case 'webapi_add_and_pop':
                // Atomic operation: add to Web APIs and pop from CallStack
                store.addToWebAPIs(microStep.data);
                store.popFromCallStack();
                await this.delay(duration);
                break;

            case 'webapi_remove':
                store.removeFromWebAPIs(microStep.id);
                await this.delay(duration);
                break;

            case 'taskqueue_add':
                store.addToTaskQueue(microStep.data);
                await this.delay(duration);
                break;

            case 'taskqueue_remove':
                store.removeFromTaskQueue(microStep.id);
                await this.delay(duration);
                break;

            case 'microtask_add':
                store.addToMicrotaskQueue(microStep.data);
                await this.delay(duration);
                break;

            case 'microtask_remove':
                store.removeFromMicrotaskQueue();
                await this.delay(duration);
                break;

            case 'rafqueue_add':
                store.addToRAFQueue(microStep.data);
                await this.delay(duration);
                break;

            case 'rafqueue_remove':
                store.removeFromRAFQueue(microStep.id);
                await this.delay(duration);
                break;

            case 'execute_callback':
                if (microStep.callback) {
                    microStep.callback();
                }
                await this.delay(duration);
                break;

            default:
                await this.delay(duration);
        }
    }
}
