// eslint-disable-next-line max-classes-per-file
"use strict";
const { Scope, Variable, Reference } = require("eslint-scope");
const { Definition } = require("eslint-scope/lib/definition");

class SvelteScope extends Scope {
  constructor(scopeManager, name, upperScope, block) {
    super(scopeManager, `svelte:${name}`, upperScope, block, false);
  }

  __defineTemplateIdentifier(node) {
    const definition = new Definition(Variable.Variable, node.name, node);
    this.__defineGeneric(node.name, this.set, this.variables, node, definition);
    this.__referencing(node, Reference.WRITE, node, null, false, true);
  }

  __defineTemplateDestructuringIdentifiers(node) {
    if (node.type === "Identifier") {
      this.__defineTemplateIdentifier(node);
    } else if (node.type === "ObjectPattern") {
      node.properties
        .map(property => property.value)
        .forEach(this.__defineTemplateIdentifier, this);
    } else if (node.type === "ArrayPattern") {
      node.elements.forEach(this.__defineTemplateIdentifier, this);
    } else {
      throw new Error(
        `Unexpected node type '${
          node.type
        }' for template declaration identifiers`
      );
    }
  }
}

class AwaitScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "AwaitBlock") {
      throw new Error(`Unexpected block type '${block.type}' for await scope.`);
    }

    super(scopeManager, "await", upperScope, block);

    if (block.value) {
      this.__defineTemplateIdentifier(block.value);
    }
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

    if (block.value) {
      this.__defineTemplateIdentifier(block.value);
    }
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

    if (block.error) {
      this.__defineTemplateIdentifier(block.error);
    }
  }
}

class EachScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "EachBlock") {
      throw new Error(`Unexpected block type '${block.type}' for each scope.`);
    }

    super(scopeManager, "each", upperScope, block);

    this.__defineTemplateDestructuringIdentifiers(block.context);

    if (block.index) {
      this.__defineTemplateIdentifier(block.index);
    }
  }
}

class InlineComponentScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "InlineComponent") {
      throw new Error(
        `Unexpected block type '${block.type}' for component scope.`
      );
    }

    super(scopeManager, "component", upperScope, block);
  }
}

module.exports = {
  AwaitScope,
  AwaitThenScope,
  AwaitCatchScope,
  EachScope,
  InlineComponentScope
};
