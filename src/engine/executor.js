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
import { Scope } from './utils/scope.js';

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

        // Scope Management
        this.globalScope = new Scope();
        this.currentScope = this.globalScope;

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
            return { success: false, error: `Syntax error: ${error.message}` };
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
     * Evaluate an AST node to get its runtime value
     */
    evaluate(node) {
        if (!node) return undefined;

        switch (node.type) {
            case 'Literal':
                return node.value;

            case 'Identifier':
                return this.currentScope.get(node.name);

            case 'BinaryExpression':
                const left = this.evaluate(node.left);
                const right = this.evaluate(node.right);
                switch (node.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return left / right;
                    case '%': return left % right;
                    case '>': return left > right;
                    case '<': return left < right;
                    case '>=': return left >= right;
                    case '<=': return left <= right;
                    case '==': return left == right;
                    case '===': return left === right;
                    case '!=': return left != right;
                    case '!==': return left !== right;
                    default: return undefined;
                }

            case 'CallExpression':
                // For function calls in expressions (e.g., let x = add(1, 2))
                // We need to execute the function and get the return value
                return this.handleCallExpression(node);

            case 'ArrowFunctionExpression':
                return {
                    type: 'function',
                    params: node.params.map(p => p.name),
                    body: node.body,
                    scope: this.currentScope // Capture lexical scope
                };

            case 'UpdateExpression':
                if (node.argument.type === 'Identifier') {
                    const name = node.argument.name;
                    const oldValue = this.currentScope.get(name);
                    const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;

                    this.currentScope.set(name, newValue);
                    return node.prefix ? newValue : oldValue;
                }
                return undefined;

            case 'AssignmentExpression':
                if (node.left.type === 'Identifier') {
                    const name = node.left.name;
                    const rightVal = this.evaluate(node.right);
                    let newVal;

                    const currentVal = this.currentScope.get(name);

                    switch (node.operator) {
                        case '=': newVal = rightVal; break;
                        case '+=': newVal = currentVal + rightVal; break;
                        case '-=': newVal = currentVal - rightVal; break;
                        case '*=': newVal = currentVal * rightVal; break;
                        case '/=': newVal = currentVal / rightVal; break;
                        default: newVal = rightVal;
                    }

                    this.currentScope.set(name, newVal);
                    return newVal;
                }
                return undefined;

            default:
                return undefined;
        }
    }

    /**
     * Walk through AST nodes and create execution steps
     * Returns: execution result (e.g., return value) if applicable
     */
    walkAST(node, parent = null) {
        if (!node) return;

        // Reset execution state result
        let result = undefined;

        switch (node.type) {
            case 'Program':
                // Reset scope for new run
                this.globalScope = new Scope();
                this.currentScope = this.globalScope;

                for (const stmt of node.body) {
                    const res = this.walkAST(stmt, node);
                    if (res && res.type === 'return') return res;
                }
                break;

            case 'BlockStatement':
                for (let i = 0; i < node.body.length; i++) {
                    const stmt = node.body[i];

                    // Check for Await (ExpressionStatement)
                    if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'AwaitExpression') {
                        const awaitExpr = stmt.expression;

                        // 1. Evaluate the promise (Argument of await)
                        this.evaluate(awaitExpr.argument);

                        // 2. Schedule the rest of the block as a Microtask (Continuation)
                        const remainingStatements = node.body.slice(i + 1);

                        // If there are remaining statements, defer them
                        if (remainingStatements.length > 0) {
                            const microtaskId = this.microtaskIdCounter++;
                            const continuationBlock = {
                                type: 'BlockStatement',
                                body: remainingStatements
                            };

                            // Wrap in ArrowFunction so CallbackParser handles it correctly
                            const continuationFunction = {
                                type: 'ArrowFunctionExpression',
                                params: [],
                                body: continuationBlock,
                                async: true,
                                expression: false
                            };

                            this.deferredMicrotasks.push({
                                microtaskId,
                                callbackNode: continuationFunction,
                                type: 'Promise.then (await)',
                                scope: this.currentScope // Capture Closure Scope!
                            });
                        }

                        // 3. STOP execution of this block immediately
                        return 'SUSPEND'; // "Suspend" function
                    }

                    const res = this.walkAST(stmt, node);
                    if (res === 'SUSPEND') {
                        // Execution suspended in a child (e.g., inside a loop), but we still have remaining statements in THIS block.
                        // We must append them to the pending microtask so they run after the child finishes.
                        const remainingStatements = node.body.slice(i + 1);
                        if (remainingStatements.length > 0) {
                            const lastTask = this.deferredMicrotasks[this.deferredMicrotasks.length - 1];
                            if (lastTask && lastTask.callbackNode && lastTask.callbackNode.body) {
                                const callbackBody = lastTask.callbackNode.body.body; // Array of statements
                                if (Array.isArray(callbackBody)) {
                                    // Append remaining statements to the END of the continuation
                                    // (This ensures they run after the child's continuation logic completes)
                                    remainingStatements.forEach(s => callbackBody.push(s));
                                }
                            }
                        }
                        return 'SUSPEND'; // Propagate suspension
                    }
                    if (res && res.type === 'return') return res;
                }
                break;

            case 'ForStatement':
                // 1. Init (Run once)
                if (node.init) this.walkAST(node.init);

                // 2. Loop
                let iterations = 0;
                while (this.evaluate(node.test)) {
                    if (iterations++ > 1000) {
                        console.warn('Infinite loop detected in ForStatement');
                        break;
                    }

                    // Execute body
                    const res = this.walkAST(node.body, node);

                    // Check for Await Suspension
                    if (res === 'SUSPEND') {
                        // The body suspended (hit await).
                        // We must append the "Rest of Loop" (Update + Next Iteration) to the pending Microtask.
                        const lastTask = this.deferredMicrotasks[this.deferredMicrotasks.length - 1];

                        if (lastTask && lastTask.callbackNode && lastTask.callbackNode.body) {
                            // Ensure we have the body array (continuation is ArrowFunc -> Block -> body array)
                            const blockBody = lastTask.callbackNode.body.body;

                            if (Array.isArray(blockBody)) {
                                // Append Update
                                if (node.update) {
                                    blockBody.push({
                                        type: 'ExpressionStatement',
                                        expression: node.update
                                    });
                                }
                                // Append Next Loop Iteration
                                blockBody.push({
                                    ...node,
                                    init: null,
                                    type: 'ForStatement'
                                });
                            }
                        }
                        return 'SUSPEND'; // Stop this stack frame
                    }

                    if (res && res.type === 'return') return res;

                    // Execute Update
                    if (node.update) this.evaluate(node.update);
                }
                break;

            case 'ExpressionStatement':
                // Regular expression statement - evaluate it for side effects (e.g. function calls)
                this.evaluate(node.expression);
                break;

            case 'CallExpression':
                this.handleCallExpression(node);
                break;

            case 'FunctionDeclaration':
                this.functionHandler.registerFunction(node);
                break;

            case 'VariableDeclaration':
                node.declarations.forEach(decl => {
                    const value = decl.init ? this.evaluate(decl.init) : undefined;
                    this.currentScope.set(decl.id.name, value);

                    this.steps.push({
                        type: 'variable_declaration',
                        name: decl.id.name,
                        value: value, // Store value for visualization
                        action: () => {
                            // Variable declaration action
                        },
                    });
                });
                break;

            case 'ReturnStatement':
                const returnValue = node.argument ? this.evaluate(node.argument) : undefined;
                return { type: 'return', value: returnValue };

            case 'IfStatement':
                const test = this.evaluate(node.test);
                if (test) {
                    return this.walkAST(node.consequent, node);
                } else if (node.alternate) {
                    return this.walkAST(node.alternate, node);
                }
                break;

            default:
                // Handle generic recursive walking for other nodes
                // Note: We avoid blind recursion for control flow nodes handled above
                if (node.body && !Array.isArray(node.body) && node.type !== 'BlockStatement') {
                    return this.walkAST(node.body, node);
                }
        }

        return result;
    }

    /**
     * Handle function call expressions
     */
    handleCallExpression(node) {
        // Evaluate the object of the call if it's a method chain (e.g. Promise.resolve().then())
        // This ensures the "left-hand side" executes first!
        if (node.callee.type === 'MemberExpression') {
            this.evaluate(node.callee.object);
        }

        const callee = getCalleeName(node.callee);

        // Handle special Web API functions
        if (callee === 'setTimeout') {
            this.timerHandler.handleSetTimeout(node);
        } else if (callee === 'setInterval') {
            this.timerHandler.handleSetInterval(node);
        } else if (callee === 'requestAnimationFrame') {
            this.timerHandler.handleRAF(node);
        } else if (callee === 'Promise.resolve' || callee === 'Promise.reject' || callee === 'Promise.all') {
            this.promiseHandler.handlePromiseResolve(node);
        } else if (node.callee.type === 'MemberExpression' && (node.callee.property.name === 'then' || node.callee.property.name === 'catch')) {
            // Chains: .then() or .catch()
            const callback = node.arguments[0];
            const method = node.callee.property.name;
            this.promiseHandler.handlePromiseChain(node, callback, method);
        } else if (callee === 'console.log' || callee === 'console.error' || callee === 'console.warn') {
            const type = callee.split('.')[1];
            this.consoleHandler.handle(node, type);
        } else {
            // Check scope for function variables (Arrow functions / Expressions)
            const scopeValue = this.currentScope.get(callee);

            if (scopeValue && (scopeValue.type === 'function' || typeof scopeValue === 'function')) {
                // It's a Variable-based function (arrow or expression)
                return this.functionHandler.handleFunctionCall(node, callee, scopeValue);
            } else if (this.functionRegistry[callee]) {
                // It's a FunctionDeclaration
                return this.functionHandler.handleFunctionCall(node, callee);
            } else {
                // Unknown function call - skip or handle gracefully
                this.microSteps.push({
                    type: 'highlight',
                    line: node.loc?.start.line || null,
                    duration: 300
                });
            }
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
            for (let i = this.currentMicroStep; i < this.microSteps.length; i++) {
                const microStep = this.microSteps[i];
                this.currentMicroStep = i;

                // Check Pause State
                while (useVisualizerStore.getState().isPaused) {
                    if (!useVisualizerStore.getState().isRunning) return; // Exit if stopped
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                await this.executeMicroStep(microStep, speedMultiplier);
            }
        } catch (error) {
            console.error('Runtime Error:', error);
            useVisualizerStore.getState().addToConsole(`Runtime Error: ${error.message}`);
        } finally {
            useVisualizerStore.getState().setIsRunning(false);
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
