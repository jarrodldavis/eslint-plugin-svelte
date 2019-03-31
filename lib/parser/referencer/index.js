"use strict";

const { ScopeManager } = require("eslint-scope");
const { BASE_SVELTE_KEYS } = require("../keys");
const { SvelteReferencer } = require("./referencer");
const { handle_compiler_variable } = require("./injected");

// https://github.com/eslint/eslint-scope/blob/14c092a6efd4dd0bf701bf4f8f518eac6b29b2ce/lib/index.js#L61-L76
function default_options() {
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

function analyze(ast, providedOptions, compiler_variables) {
  const options = {
    ...default_options(),
    ...providedOptions,
    childVisitorKeys: BASE_SVELTE_KEYS
  };
  const manager = new ScopeManager(options);
  const referencer = new SvelteReferencer(options, manager);
  referencer.visit(ast);

  if (manager.__currentScope !== null) {
    throw new Error("currentScope should be null");
  }

  const global_scope = manager.globalScope;
  for (const variable of compiler_variables) {
    handle_compiler_variable(global_scope, variable);
  }

  return manager;
}

module.exports = { analyze };
