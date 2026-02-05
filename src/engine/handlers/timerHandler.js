/**
 * Timer Handler
 * Handles setTimeout, setInterval, and requestAnimationFrame
 */
export class TimerHandler {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Handle setTimeout
     */
    handleSetTimeout(node) {
        const timerId = this.executor.timerIdCounter++;
        const delay = this.getDelayFromArgs(node.arguments);
        const callbackNode = node.arguments[0];
        const line = node.loc?.start.line || null;

        // Highlight setTimeout line
        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        // Push setTimeout to CallStack
        this.executor.microSteps.push({
            type: 'callstack_push',
            name: `setTimeout(fn, ${delay})`,
            duration: 300
        });

        // Add to Web APIs
        this.executor.microSteps.push({
            type: 'webapi_add',
            data: {
                id: timerId,
                type: 'setTimeout',
                delay: delay
            },
            duration: 300
        });

        // Pop setTimeout from CallStack
        this.executor.microSteps.push({
            type: 'callstack_pop',
            duration: 300
        });

        // DEFER the callback
        this.executor.deferredCallbacks.push({
            timerId,
            callbackNode,
            type: 'setTimeout'
        });

        // Keep old step for compatibility
        this.executor.steps.push({
            type: 'setTimeout',
            timerId,
            delay,
            line: line,
            action: () => { },
        });
    }

    /**
     * Handle setInterval
     */
    handleSetInterval(node) {
        const intervalId = this.executor.timerIdCounter++;
        const delay = this.getDelayFromArgs(node.arguments);
        const line = node.loc?.start.line || null;

        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        this.executor.steps.push({
            type: 'setInterval',
            intervalId,
            delay,
            line: line,
            action: () => { },
        });
    }

    /**
     * Handle requestAnimationFrame
     */
    handleRAF(node) {
        const rafId = this.executor.timerIdCounter++;
        const line = node.loc?.start.line || null;

        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        this.executor.steps.push({
            type: 'requestAnimationFrame',
            rafId,
            line: line,
            action: () => { },
        });
    }

    /**
     * Get delay from setTimeout/setInterval arguments
     */
    getDelayFromArgs(args) {
        if (args.length > 1 && args[1].type === 'Literal') {
            return args[1].value;
        }
        return 0;
    }
}
