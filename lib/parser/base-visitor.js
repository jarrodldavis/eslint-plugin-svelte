"use strict";

const { replace, VisitorOption } = require("estraverse");
const { matches, parse: parse_query } = require("esquery");

const { KEYS } = require("./keys");

class BaseVisitor {
  static *get_handlers(visitor) {
    let object = visitor;

    while (object && object !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(object)) {
        if (key.startsWith("_") || key === "constructor" || key === "visit") {
          continue;
        }

        const value = Reflect.get(object, key);

        if (typeof value !== "function") {
          continue;
        }

        yield [key, value];
      }

      object = Object.getPrototypeOf(object);
    }
  }

  static compile_handlers(visitor) {
    const handlers = [];

    for (const [query, handler] of BaseVisitor.get_handlers(visitor)) {
      const is_leave = query.endsWith(":leave");
      const normalized_query = query.replace(/:leave$/u, "");
      handlers.push({
        query: parse_query(normalized_query),
        traversal_direction: is_leave ? "leave" : "enter",
        handler: handler.bind(visitor)
      });
    }

    return handlers;
  }

  constructor() {
    if (Object.getPrototypeOf(this) === BaseVisitor.prototype) {
      throw new Error("BaseVisitor must be subclassed to be instantiated");
    }

    this.current_ancestry = [];
    this.handlers = BaseVisitor.compile_handlers(this);

    if (this.handlers.length === 0) {
      throw new Error(
        `Visitor class '${this.constructor.name}' has no handlers defind.`
      );
    }
  }

  visit(root) {
    replace(root, {
      enter: this._enter.bind(this),
      leave: this._leave.bind(this),
      keys: KEYS,
      fallback: "iteration"
    });

    if (this.current_ancestry.length > 0) {
      throw new Error("Unexpected dangling ancestry entries");
    }
  }

  _enter(node, parent) {
    // when entering the root node, estraverse sets `parent` to that root node
    if (parent && parent !== node) {
      this.current_ancestry.unshift(parent);
    }

    return this._handler_loop(node, "enter");
  }

  _leave(node, parent) {
    const return_value = this._handler_loop(node, "leave");

    // when leaving the root node, estraverse sets `parent` to that root node
    if (parent && parent !== node) {
      const removed = this.current_ancestry.shift();
      if (removed === undefined) {
        throw new Error("Unexpected empty ancestry list");
      }
    }

    return return_value;
  }

  _handler_loop(node, direction) {
    const return_values = [];

    for (const handler of this.handlers) {
      const return_value = this._execute_handler(node, direction, handler);

      if (return_value === VisitorOption.Skip) {
        return return_value;
      } else if (return_value === VisitorOption.Break) {
        // leave handlers for all nodes are not called when estraverse breaks traversal
        this.current_ancestry = [];
        return return_value;
      } else if (return_value === VisitorOption.Remove) {
        // leave handler for current node is not called when estraverse removes a node
        this.current_ancestry.shift();
        return return_value;
      } else if (return_value) {
        return_values.push(return_value);
      }
    }

    if (return_values.length > 1) {
      throw new Error("Multiple handlers returned a value for a single node");
    } else {
      return return_values[0];
    }
  }

  _execute_handler(node, traversal_direction, handler) {
    if (handler.traversal_direction !== traversal_direction) {
      return null;
    }

    if (!matches(node, handler.query, this.current_ancestry)) {
      return null;
    }

    return handler.handler(node);
  }
}

module.exports = { BaseVisitor };
