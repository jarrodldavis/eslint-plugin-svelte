const { ScopeManager } = require("eslint-scope");
const Referencer = require("eslint-scope/lib/referencer");

class SvelteReferencer extends Referencer {
  Fragment() {
    throw new Error("Fragment nodes should be converted to Program nodes");
  }

  AwaitBlock(node) {
    // TODO: register variable declarations for `node.value` and `node.error`
    this.BlockStatement(node);
  }

  PendingBlock(node) {
    this.BlockStatement(node);
  }

  ThenBlock(node) {
    this.BlockStatement(node);
  }

  CatchBlock(node) {
    this.BlockStatement(node);
  }

  EachBlock(node) {
    // TODO: register variable declarations for `node.context`, `node.index`, and `node.key`
    this.BlockStatement(node);
  }

  IfBlock(node) {
    this.BlockStatement(node);
  }

  ElseBlock(node) {
    this.BlockStatement(node);
  }

  InlineComponent() {
    // TODO: register variable reference for `node.name` for imported components
  }
}

// https://github.com/eslint/eslint-scope/blob/14c092a6efd4dd0bf701bf4f8f518eac6b29b2ce/lib/index.js#L61-L76
function defaultOptions() {
  return {
    optimistic: false,
    directive: false,
    nodejsScope: false,
    impliedStrict: false,
    sourceType: "script", // one of ['script', 'module']
    ecmaVersion: 5,
    childVisitorKeys: null,
    fallback: "iteration"
  };
}

function analyze(ast, providedOptions) {
  const options = { ...defaultOptions(), ...providedOptions };
  const manager = new ScopeManager(options);
  const referencer = new SvelteReferencer(options, manager);
  referencer.visit(ast);

  if (manager.__currentScope !== null) {
    throw new Error("currentScope should be null");
  }

  return manager;
}

module.exports = { analyze };
