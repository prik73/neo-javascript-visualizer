import { Scope } from '../utils/scope.js';

/**
 * Function Handler
 * Handles user-defined custom functions with scope and return values
 */
export class FunctionHandler {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Handle user-defined function calls
     */
    handleFunctionCall(node, funcName, funcDef = null) {
        const func = funcDef || this.executor.functionRegistry[funcName];
        if (!func) return undefined;

        const line = node.loc?.start.line || null;

        // 1. Evaluate Arguments
        const argValues = node.arguments.map(arg => this.executor.evaluate(arg));

        // Format args for display
        const displayArgs = argValues.map(val => {
            if (typeof val === 'string') return `"${val}"`;
            if (typeof val === 'object') return '{...}';
            return String(val);
        }).join(', ');

        const displayName = `${funcName}(${displayArgs})`;

        // Highlight function call line
        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            description: `Calling function ${displayName}`,
            duration: 400
        });

        // Push function to CallStack
        this.executor.microSteps.push({
            type: 'callstack_push',
            name: displayName,
            description: `Pushing ${funcName} to Call Stack`,
            duration: 300
        });

        // 2. Create Function Scope (Closure Support)
        // Parent scope is the scope where function was DEFINED (lexical scoping)
        const callScope = new Scope(func.scope);

        // Bind arguments to parameters
        func.params.forEach((paramName, index) => {
            const value = argValues[index];
            callScope.set(paramName, value);
        });

        // Switch execution context
        const previousScope = this.executor.currentScope;
        this.executor.currentScope = callScope;

        // 3. Execute Function Body
        let returnValue = undefined;

        if (func.body) {
            // If body is BlockStatement, walkAST handles the block
            // If expression (arrow function implicit return), we evaluate it
            if (func.body.type === 'BlockStatement') {
                const result = this.executor.walkAST(func.body, func.node);
                if (result && result.type === 'return') {
                    returnValue = result.value;
                }
            } else {
                // Implicit return for arrow functions (e.g., const add = (a,b) => a+b)
                returnValue = this.executor.evaluate(func.body);
            }
        }

        // Restore execution context
        this.executor.currentScope = previousScope;

        // Pop function from CallStack
        this.executor.microSteps.push({
            type: 'callstack_pop',
            duration: 300,
            result: returnValue // Optional: visualize return value
        });

        // Keep old step for compatibility
        this.executor.steps.push({
            type: 'function_call',
            name: funcName,
            line: line,
            action: () => { },
        });

        return returnValue;
    }

    /**
     * Register function declaration
     */
    registerFunction(node) {
        const funcName = node.id.name;

        // Store function definition with current scope (Closure)
        this.executor.functionRegistry[funcName] = {
            name: funcName,
            params: node.params.map(p => p.name),
            body: node.body,
            node: node,
            scope: this.executor.currentScope // Capture lexical scope
        };

        // Add micro-step to show function declaration
        this.executor.microSteps.push({
            type: 'highlight',
            line: node.loc?.start.line || null,
            duration: 300
        });

        // Keep old step for compatibility
        this.executor.steps.push({
            type: 'function_declaration',
            name: funcName,
            action: () => { },
        });
    }
}
