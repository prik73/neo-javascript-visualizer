import { parse } from 'acorn';
import useVisualizerStore from '../store/visualizerStore';
import { ConsoleHandler } from './handlers/consoleHandler.js';
import { TimerHandler } from './handlers/timerHandler.js';
import { PromiseHandler } from './handlers/promiseHandler.js';
import { FunctionHandler } from './handlers/functionHandler.js';
import { getCalleeName } from './utils/astUtils.js';
import { CallbackParser } from './utils/callbackParser.js';
import { MicroStepExecutor } from './microSteps/microStepExecutor.js';
import { MicroStepGenerator } from './microSteps/microStepGenerator.js';

/**
 * Main execution engine for JavaScript code visualization
 * Parses code, instruments it, and executes step-by-step
 */
class Executor {
    constructor() {
        this.ast = null;
        this.currentStep = 0;
        this.steps = [];
        this.microSteps = [];
        this.currentMicroStep = 0;
        this.deferredCallbacks = [];  // Queue for async callbacks (setTimeout)
        this.deferredMicrotasks = [];  // Queue for microtasks (Promise.then)
        this.functionRegistry = {};  // Store user-defined functions
        this.timerIdCounter = 0;
        this.microtaskIdCounter = 0;
        this.isExecuting = false;
        this.activeTimers = [];
        this.MAX_STEPS = 10000;
        this.MAX_CODE_LENGTH = 50000;

        // Initialize handlers
        this.consoleHandler = new ConsoleHandler(this);
        this.timerHandler = new TimerHandler(this);
        this.promiseHandler = new PromiseHandler(this);
        this.functionHandler = new FunctionHandler(this);
        this.callbackParser = new CallbackParser(this);
        this.microStepExecutor = new MicroStepExecutor(this);
        this.microStepGenerator = new MicroStepGenerator(this);
    }



    /**
     * Execute a single micro-step
     */
    /**
     * Execute a single micro-step
     */
    async executeMicroStep(microStep, speedMultiplier = 1) {
        return this.microStepExecutor.executeMicroStep(microStep, speedMultiplier);
    }

    /**
     * Parse the user's code into an AST
     */
    parseCode(code) {
        try {
            // Input validation
            if (!code || typeof code !== 'string') {
                return { success: false, error: 'Invalid code input' };
            }

            if (code.length > this.MAX_CODE_LENGTH) {
                return { success: false, error: 'Code exceeds maximum length' };
            }

            this.ast = parse(code, {
                ecmaVersion: 2022,
                sourceType: 'script',
            });
            return { success: true, ast: this.ast };
        } catch (error) {
            // Generic error message to avoid information disclosure
            return { success: false, error: 'Syntax error in code' };
        }
    }

    /**
     * Generate execution steps from the AST
     */
    /**
     * Generate execution steps from the AST
     */
    generateSteps(code) {
        return this.microStepGenerator.generate(code);
    }

    /**
     * Walk through AST nodes and create execution steps
     */
    walkAST(node, parent = null) {
        if (!node) return;

        switch (node.type) {
            case 'Program':
                node.body.forEach(stmt => this.walkAST(stmt, node));
                break;

            case 'ExpressionStatement':
                // Check if this is Promise.resolve().then() pattern
                if (node.expression.type === 'CallExpression') {
                    const expr = node.expression;

                    // Check if this is a .then() call
                    if (expr.callee.type === 'MemberExpression' &&
                        expr.callee.property.name === 'then' &&
                        expr.callee.object.type === 'CallExpression') {

                        const promiseCall = expr.callee.object;
                        const callee = getCalleeName(promiseCall.callee);

                        // Check if the object is Promise.resolve()
                        if (callee === 'Promise.resolve' || callee === 'Promise.reject') {
                            // This is Promise.resolve().then(callback)
                            const thenCallback = expr.arguments[0];  // The callback function
                            this.promiseHandler.handlePromiseChain(promiseCall, thenCallback);
                            break;  // Don't process further
                        }
                    }
                }

                // Regular expression statement
                this.walkAST(node.expression, node);
                break;

            case 'CallExpression':
                this.handleCallExpression(node);
                break;

            case 'FunctionDeclaration':
                this.functionHandler.registerFunction(node);
                break;

            case 'VariableDeclaration':
                node.declarations.forEach(decl => {
                    this.steps.push({
                        type: 'variable_declaration',
                        name: decl.id.name,
                        action: () => {
                            // Variable declaration
                        },
                    });
                });
                break;

            default:
                // Handle other node types
                if (node.body) this.walkAST(node.body, node);
                if (node.consequent) this.walkAST(node.consequent, node);
                if (node.alternate) this.walkAST(node.alternate, node);
        }
    }

    /**
     * Handle function call expressions
     */
    handleCallExpression(node) {
        const callee = getCalleeName(node.callee);

        // Handle special Web API functions
        if (callee === 'setTimeout') {
            this.timerHandler.handleSetTimeout(node);
        } else if (callee === 'setInterval') {
            this.timerHandler.handleSetInterval(node);
        } else if (callee === 'requestAnimationFrame') {
            this.timerHandler.handleRAF(node);
        } else if (callee === 'Promise.resolve' || callee === 'Promise.reject') {
            this.promiseHandler.handlePromiseResolve(node);
        } else if (callee === 'then') {
            // .then() is handled by handlePromiseChain
            // Skip to avoid double processing
        } else if (callee === 'console.log') {
            this.consoleHandler.handle(node);
        } else if (this.functionRegistry[callee]) {
            // User-defined function call
            this.functionHandler.handleFunctionCall(node, callee);
        } else {
            // Unknown function call - skip or handle gracefully
            this.microSteps.push({
                type: 'highlight',
                line: node.loc?.start.line || null,
                duration: 300
            });
        }
    }



    /**
     * Push function to call stack
     */


    /**
     * Execute next step
     */
    async executeNextStep() {
        // Use micro-steps if available
        if (this.microSteps.length > 0) {
            if (this.currentMicroStep >= this.microSteps.length) {
                return { done: true };
            }

            const microStep = this.microSteps[this.currentMicroStep];
            const store = useVisualizerStore.getState();
            const speed = store.speed || 500;
            const speedMultiplier = speed / 500;

            await this.executeMicroStep(microStep, speedMultiplier);
            this.currentMicroStep++;
            return { done: false, microStep };
        } else {
            // Fallback to old steps
            if (this.currentStep >= this.steps.length) {
                return { done: true };
            }

            const step = this.steps[this.currentStep];
            step.action();
            this.currentStep++;
            return { done: false, step };
        }
    }

    /**
     * Execute all steps
     */
    async executeAll(speed = 500) {
        // Race condition guard
        if (this.isExecuting) {
            console.warn('Execution already in progress');
            return;
        }

        this.isExecuting = true;
        const store = useVisualizerStore.getState();
        store.setIsRunning(true);

        // Calculate speed multiplier (500ms = 1x, 100ms = 0.2x, 2000ms = 4x)
        const speedMultiplier = speed / 500;

        try {
            // Execute all micro-steps with smooth timing
            for (const microStep of this.microSteps) {
                await this.executeMicroStep(microStep, speedMultiplier);
            }
        } finally {
            store.setIsRunning(false);
            this.isExecuting = false;
        }
    }

    /**
     * Reset executor state
     */
    reset() {
        // Clear all active timers to prevent memory leaks
        this.activeTimers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });

        this.ast = null;
        this.currentStep = 0;
        this.steps = [];
        this.microSteps = [];
        this.currentMicroStep = 0;
        this.deferredCallbacks = [];
        this.deferredMicrotasks = [];
        this.functionRegistry = {};
        this.activeTimers = [];
        this.timerIdCounter = 0;
        this.microtaskIdCounter = 0;
        this.isExecuting = false;
    }
}

export default new Executor();
