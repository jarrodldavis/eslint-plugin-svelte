// eslint-disable-next-line max-classes-per-file
"use strict";
const { Scope } = require("eslint-scope");

class SvelteScope extends Scope {
  constructor(scopeManager, name, upperScope, block) {
    super(scopeManager, `svelte:${name}`, upperScope, block, false);
  }

  __defineExpressionIdentifier(name) {
    // based on FunctionScope's handling of `arguments` (in eslint-scope)
    this.__defineGeneric(name, this.set, this.variables, null, null);
    this.taints.set(name, true);
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

    this.__defineExpressionIdentifier(upperScope.block.value);
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

    this.__defineExpressionIdentifier(upperScope.block.error);
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
      this.__defineExpressionIdentifier(block.index);
    }
  }

  __defineContext(node) {
    const define = this.__defineExpressionIdentifier.bind(this);

    if (node.type === "Identifier") {
      define(node.name);
    } else if (node.type === "ObjectPattern") {
      node.properties.map(property => property.value.name).forEach(define);
    } else if (node.type === "ArrayPattern") {
      node.elements.map(element => element.name).forEach(define);
    } else {
      throw new Error(`Unexpected each block context node type '${node.type}'`);
    }
  }
}

module.exports = { AwaitScope, AwaitThenScope, AwaitCatchScope, EachScope };
