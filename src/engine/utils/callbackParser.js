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
    /**
     * Parse callback function body into micro-steps
     */
    parse(callbackNode) {
        if (!callbackNode) return [];

        // 1. Temporarily swap steps array to capture actions
        const originalMicroSteps = this.executor.microSteps;
        const capturedSteps = [];
        this.executor.microSteps = capturedSteps;

        try {
            // 2. Execute the body using the main AST walker
            // This ensures ALL logic (checking promises, timers, console, etc.) runs exactly like main code
            const body = callbackNode.body;

            // Handle arrow function implicit return / expression body
            if (callbackNode.type === 'ArrowFunctionExpression' && body.type !== 'BlockStatement') {
                // If it's an expression like () => console.log('hi'), wrap in Statement for walker?
                // Or just evaluate? walkAST expects Statements.
                // Wrapper: { type: 'ExpressionStatement', expression: body }
                this.executor.walkAST({
                    type: 'ExpressionStatement',
                    expression: body,
                    loc: body.loc // Preserve location
                });
            } else {
                // BlockStatement
                this.executor.walkAST(body);
            }

        } catch (e) {
            console.error('Error parsing callback:', e);
        } finally {
            // 3. Restore original array
            this.executor.microSteps = originalMicroSteps;
        }

        return capturedSteps;
    }

    /**
     * Parse single expression (Deprecated - kept for safe removal ref)
     */
    parseExpression(expr) {
        return [];
    }
}
