/**
 * Function Handler
 * Handles user-defined custom functions
 */
export class FunctionHandler {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Handle user-defined function calls
     */
    handleFunctionCall(node, funcName) {
        const func = this.executor.functionRegistry[funcName];
        const line = node.loc?.start.line || null;

        // Extract arguments
        const args = node.arguments.map(arg => {
            if (arg.type === 'Literal') {
                return JSON.stringify(arg.value);
            } else if (arg.type === 'Identifier') {
                return arg.name;
            }
            return '...';
        });

        const displayName = args.length > 0
            ? `${funcName}(${args.join(', ')})`
            : `${funcName}()`;

        // Highlight function call line
        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        // Push function to CallStack
        this.executor.microSteps.push({
            type: 'callstack_push',
            name: displayName,
            duration: 300
        });

        // Execute function body
        if (func.body && func.body.body) {
            func.body.body.forEach(stmt => {
                this.executor.walkAST(stmt, func.body);
            });
        }

        // Pop function from CallStack
        this.executor.microSteps.push({
            type: 'callstack_pop',
            duration: 300
        });

        // Keep old step for compatibility
        this.executor.steps.push({
            type: 'function_call',
            name: funcName,
            line: line,
            action: () => { },
        });
    }

    /**
     * Register function declaration
     */
    registerFunction(node) {
        const funcName = node.id.name;
        this.executor.functionRegistry[funcName] = {
            name: funcName,
            params: node.params.map(p => p.name),
            body: node.body,
            node: node
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
