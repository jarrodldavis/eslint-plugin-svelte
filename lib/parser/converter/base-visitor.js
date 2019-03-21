"use strict";

const { replace, VisitorOption } = require("estraverse");
const { matches, parse: parse_query } = require("esquery");

const { KEYS } = require("../keys");

const ANCESTRY = Symbol("BaseVisitor.ancestry");
const HANDLERS = Symbol("BaseVisitor.handlers");
const ENTER = Symbol("BaseVisitor.enter()");
const LEAVE = Symbol("BaseVisitor.leave()");
const HANDLER_LOOP = Symbol("BaseVisitor.handler_loop()");
const EXECUTE_HANDLER = Symbol("BaseVisitor.execute_handler()");

function* get_handlers(visitor) {
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

function compile_handlers(visitor) {
  const handlers = [];

  for (const [query, handler] of get_handlers(visitor)) {
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

class BaseVisitor {
  constructor() {
    if (Object.getPrototypeOf(this) === BaseVisitor.prototype) {
      throw new Error("BaseVisitor must be subclassed to be instantiated");
    }

    this[ANCESTRY] = [];
    this[HANDLERS] = compile_handlers(this);

    if (this[HANDLERS].length === 0) {
      throw new Error(
        `Visitor class '${this.constructor.name}' has no handlers defind.`
      );
    }
  }

  visit(root) {
    replace(root, {
      enter: this[ENTER].bind(this),
      leave: this[LEAVE].bind(this),
      keys: KEYS,
      fallback: "iteration"
    });

    if (this[ANCESTRY].length > 0) {
      throw new Error("Unexpected dangling ancestry entries");
    }
  }

  [ENTER](node, parent) {
    // when entering the root node, estraverse sets `parent` to that root node
    if (parent && parent !== node) {
      this[ANCESTRY].unshift(parent);
    }

    return this[HANDLER_LOOP](node, "enter");
  }

  [LEAVE](node, parent) {
    const return_value = this[HANDLER_LOOP](node, "leave");

    // when leaving the root node, estraverse sets `parent` to that root node
    if (parent && parent !== node) {
      const removed = this[ANCESTRY].shift();
      if (removed === undefined) {
        throw new Error("Unexpected empty ancestry list");
      }
    }

    return return_value;
  }

  [HANDLER_LOOP](node, direction) {
    const return_values = [];

    for (const handler of this[HANDLERS]) {
      const return_value = this[EXECUTE_HANDLER](node, direction, handler);

      if (return_value === VisitorOption.Skip) {
        return return_value;
      } else if (return_value === VisitorOption.Break) {
        // leave handlers for all nodes are not called when estraverse breaks traversal
        this[ANCESTRY] = [];
        return return_value;
      } else if (return_value === VisitorOption.Remove) {
        // leave handler for current node is not called when estraverse removes a node
        this[ANCESTRY].shift();
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

  [EXECUTE_HANDLER](node, traversal_direction, handler) {
    if (handler.traversal_direction !== traversal_direction) {
      return null;
    }

    if (!matches(node, handler.query, this[ANCESTRY])) {
      return null;
    }

    return handler.handler(node);
  }
}

module.exports = { BaseVisitor };
