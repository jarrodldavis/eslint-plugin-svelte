// eslint-disable-next-line max-classes-per-file
"use strict";
const { Scope, Variable } = require("eslint-scope");
const { Definition } = require("eslint-scope/lib/definition");

class SvelteScope extends Scope {
  constructor(scopeManager, name, upperScope, block) {
    super(scopeManager, `svelte:${name}`, upperScope, block, false);
  }

  __defineTemplate(name, node) {
    const definition = new Definition(Variable.Variable, name, node);
    this.__defineGeneric(name, this.set, this.variables, node, definition);
  }
}

class AwaitScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "AwaitBlock") {
      throw new Error(`Unexpected block type '${block.type}' for await scope.`);
    }

    super(scopeManager, "await", upperScope, block);
  }
}

class AwaitThenScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "ThenBlock") {
      throw new TypeError(
        `Unexpected block type '${block.type}' for await:then scope.`
      );
    }

    if (upperScope.type !== "svelte:await") {
      throw new TypeError(
        `Unexpected parent scope '${upperScope.type}' for await:then scope`
      );
    }

    super(scopeManager, "await:then", upperScope, block);

    this.__defineTemplate(upperScope.block.value, block);
  }
}

class AwaitCatchScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "CatchBlock") {
      throw new TypeError(
        `Unexpected block type '${block.type}' for await:catch scope.`
      );
    }

    if (upperScope.type !== "svelte:await") {
      throw new TypeError(
        `Unexpected parent scope '${upperScope.type}' for await:catch scope`
      );
    }

    super(scopeManager, "await:catch", upperScope, block);

    this.__defineTemplate(upperScope.block.error, block);
  }
}

class EachScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "EachBlock") {
      throw new Error(`Unexpected block type '${block.type}' for each scope.`);
    }

    super(scopeManager, "each", upperScope, block);

    this.__defineContext(block.context);
    if (block.index) {
      this.__defineTemplate(block.index, block);
    }
  }

  __defineIdentifier(node) {
    this.__defineTemplate(node.name, node);
  }

  __defineContext(node) {
    if (node.type === "Identifier") {
      this.__defineIdentifier(node.name);
    } else if (node.type === "ObjectPattern") {
      node.properties
        .map(property => property.value)
        .forEach(this.__defineIdentifier, this);
    } else if (node.type === "ArrayPattern") {
      node.elements.forEach(this.__defineIdentifier, this);
    } else {
      throw new Error(`Unexpected each block context node type '${node.type}'`);
    }
  }
}

module.exports = { AwaitScope, AwaitThenScope, AwaitCatchScope, EachScope };
