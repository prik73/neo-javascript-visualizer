/**
 * Console Handler
 * Handles console.log() calls with micro-step execution
 */
export class ConsoleHandler {
    constructor(executor) {
        this.executor = executor;
    }

    /**
     * Handle console.log
     */
    handle(node) {
        const line = node.loc?.start.line || null;
        const message = this.evaluateLogArguments(node.arguments);

        // Add micro-steps for smooth execution
        this.executor.microSteps.push({
            type: 'highlight',
            line: line,
            duration: 400
        });

        this.executor.microSteps.push({
            type: 'callstack_push',
            name: `console.log(${message})`,
            duration: 300
        });

        this.executor.microSteps.push({
            type: 'console_output',
            message: message,
            duration: 200
        });

        this.executor.microSteps.push({
            type: 'callstack_pop',
            duration: 300
        });

        // Keep old step for compatibility
        this.executor.steps.push({
            type: 'console_log',
            message: message,
            line: line,
            action: () => {
                // This will be replaced by micro-step execution
            },
        });
    }

    /**
     * Evaluate console.log arguments to a string
     */
    evaluateLogArguments(args) {
        if (!args || args.length === 0) return '';

        return args.map(arg => {
            if (arg.type === 'Literal') {
                return typeof arg.value === 'string' ? arg.value : String(arg.value);
            } else if (arg.type === 'Identifier') {
                const value = this.executor.currentScope.get(arg.name);
                return value !== undefined ? String(value) : arg.name;
            } else if (arg.type === 'BinaryExpression') {
                return this.evaluateBinaryExpression(arg);
            } else if (arg.type === 'TemplateLiteral') {
                return this.evaluateTemplateLiteral(arg);
            }
            return '[complex expression]';
        }).join(' ');
    }

    /**
     * Evaluate binary expressions (e.g., 'Hello ' + name)
     */
    evaluateBinaryExpression(node) {
        const left = node.left.type === 'Literal' ? node.left.value : node.left.name || '?';
        const right = node.right.type === 'Literal' ? node.right.value : node.right.name || '?';

        if (node.operator === '+') {
            return `${left}${right}`;
        }
        return `${left} ${node.operator} ${right}`;
    }

    /**
     * Evaluate template literals
     */
    evaluateTemplateLiteral(node) {
        let result = '';
        for (let i = 0; i < node.quasis.length; i++) {
            result += node.quasis[i].value.raw;
            if (node.expressions[i]) {
                const expr = node.expressions[i];
                if (expr.type === 'Identifier') {
                    result += expr.name;
                } else if (expr.type === 'Literal') {
                    result += expr.value;
                } else {
                    result += '[expr]';
                }
            }
        }
        return result;
    }
}
