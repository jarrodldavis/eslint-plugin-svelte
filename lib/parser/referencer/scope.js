// eslint-disable-next-line max-classes-per-file
"use strict";
const { Scope } = require("eslint-scope");

class SvelteScope extends Scope {
  constructor(scopeManager, name, upperScope, block) {
    super(scopeManager, `svelte:${name}`, upperScope, block, false);
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
  }
}

class EachScope extends SvelteScope {
  constructor(scopeManager, upperScope, block) {
    if (block.type !== "EachBlock") {
      throw new Error(`Unexpected block type '${block.type}' for each scope.`);
    }

    super(scopeManager, "each", upperScope, block);
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
