"use strict";

const { ScopeManager } = require("eslint-scope");
const { KEYS } = require("../keys");
const { SvelteReferencer } = require("./referencer");

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
