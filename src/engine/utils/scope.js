/**
 * Scope Management for Interpreter
 * Handles variable storage and scope chains (closures)
 */
export class Scope {
    constructor(parent = null) {
        this.parent = parent;
        this.variables = {};
    }

    /**
     * Set a variable in the current scope
     */
    set(name, value) {
        this.variables[name] = value;
    }

    /**
     * Get a variable value, traversing the scope chain
     */
    get(name) {
        if (name in this.variables) {
            return this.variables[name];
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        return undefined;
    }

    /**
     * Check if a variable exists in the scope chain
     */
    has(name) {
        if (name in this.variables) {
            return true;
        }
        if (this.parent) {
            return this.parent.has(name);
        }
        return false;
    }
}
