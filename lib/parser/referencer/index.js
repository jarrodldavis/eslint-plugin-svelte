"use strict";

const { ScopeManager } = require("eslint-scope");
const { KEYS } = require("../keys");
const { SvelteReferencer } = require("./referencer");

/**
 * Context expressions for each blocks are functionally similar to
 * `VariableDeclaration` nodes, whose children are not recursively visited by
 * `eslint-scope`; this is to prevent duplicate references for initializer
 * identifiers.
 *
 * The following excludes the `context` key from being automatically visited
 * since `EachScope` handles creating variables and referencers for context
 * expressions in much the same way as `VariableDeclaration` nodes are handled
 * by `eslint-scope`.
 */
const visitor_keys = JSON.parse(JSON.stringify(KEYS));
visitor_keys.EachBlock = visitor_keys.EachBlock.filter(
  key => key !== "context"
);

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

function analyze(ast, providedOptions) {
  const options = {
    ...default_options(),
    ...providedOptions,
    childVisitorKeys: visitor_keys
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
