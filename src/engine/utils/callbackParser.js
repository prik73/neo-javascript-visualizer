import { getCalleeName, evaluateLogArguments } from './astUtils.js';

/**
 * Callback Parser
 * Parses callback function bodies into micro-steps
 */
export class CallbackParser {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Parse callback function body into micro-steps
     */
    parse(callbackNode) {
        const microSteps = [];

        if (!callbackNode) return microSteps;

        const body = callbackNode.body;

        // Handle arrow function with expression body
        if (callbackNode.type === 'ArrowFunctionExpression' && body.type !== 'BlockStatement') {
            return this.parseExpression(body);
        }

        // Handle block statement body
        if (body.type === 'BlockStatement') {
            body.body.forEach(statement => {
                if (statement.type === 'ExpressionStatement') {
                    const expr = statement.expression;

                    if (expr.type === 'CallExpression') {
                        const callee = getCalleeName(expr.callee);

                        if (callee === 'console.log') {
                            const line = statement.loc?.start.line || null;
                            const message = evaluateLogArguments(expr.arguments);

                            microSteps.push({
                                type: 'highlight',
                                line: line,
                                duration: 400
                            });

                            microSteps.push({
                                type: 'callstack_push',
                                name: `console.log(${message})`,
                                duration: 300
                            });

                            microSteps.push({
                                type: 'console_output',
                                message: message,
                                duration: 200
                            });

                            microSteps.push({
                                type: 'callstack_pop',
                                duration: 300
                            });
                        }
                    }
                }
            });
        }

        return microSteps;
    }

    /**
     * Parse single expression (for arrow functions)
     */
    parseExpression(expr) {
        const microSteps = [];

        if (expr.type === 'CallExpression') {
            const callee = getCalleeName(expr.callee);
            if (callee === 'console.log') {
                const message = evaluateLogArguments(expr.arguments);

                microSteps.push({
                    type: 'callstack_push',
                    name: `console.log(${message})`,
                    duration: 300
                });

                microSteps.push({
                    type: 'console_output',
                    message: message,
                    duration: 200
                });

                microSteps.push({
                    type: 'callstack_pop',
                    duration: 300
                });
            }
        }

        return microSteps;
    }
}
