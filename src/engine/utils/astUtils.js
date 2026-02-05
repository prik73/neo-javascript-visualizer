/**
 * AST Utilities
 * Helper functions for working with AST nodes
 */

/**
 * Get the name of the function being called
 */
export function getCalleeName(callee) {
    if (callee.type === 'Identifier') {
        return callee.name;
    } else if (callee.type === 'MemberExpression') {
        const object = callee.object.name || '';
        const property = callee.property.name || '';
        return `${object}.${property}`;
    }
    return 'anonymous';
}

/**
 * Evaluate console.log arguments (simplified)
 */
export function evaluateLogArguments(args) {
    return args
        .map(arg => {
            if (arg.type === 'Literal') {
                return String(arg.value);
            }
            return '[Object]';
        })
        .join(' ');
}

/**
 * Get delay from setTimeout/setInterval arguments
 */
export function getDelayFromArgs(args) {
    if (args.length > 1 && args[1].type === 'Literal') {
        return args[1].value;
    }
    return 0;
}
