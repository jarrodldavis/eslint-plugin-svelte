const { ScopeManager } = require("eslint-scope");
const Referencer = require("eslint-scope/lib/referencer");
const { KEYS } = require("./keys");
const {
  AwaitScope,
  AwaitThenScope,
  AwaitCatchScope,
  EachScope
} = require("./scope");

class SvelteReferencer extends Referencer {
  Fragment() {
    throw new Error("Fragment nodes should be converted to Program nodes");
  }

  AwaitBlock(node) {
    this.scopeManager.__nestScope(
      new AwaitScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  PendingBlock(node) {
    this.BlockStatement(node);
  }

  ThenBlock(node) {
    this.scopeManager.__nestScope(
      new AwaitThenScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  CatchBlock(node) {
    this.scopeManager.__nestScope(
      new AwaitCatchScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  EachBlock(node) {
    this.scopeManager.__nestScope(
      new EachScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  IfBlock(node) {
    this.BlockStatement(node);
  }

  ElseBlock(node) {
    this.BlockStatement(node);
  }

  InlineComponent(node) {
    this.visitChildren(node);
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
  const options = {
    ...defaultOptions(),
    ...providedOptions,
    childVisitorKeys: KEYS
  };
  const manager = new ScopeManager(options);
  const referencer = new SvelteReferencer(options, manager);
  referencer.visit(ast);

  if (manager.__currentScope !== null) {
    throw new Error("currentScope should be null");
  }

  return manager;
}

module.exports = { analyze };
