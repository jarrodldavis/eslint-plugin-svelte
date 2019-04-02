/**
 * @typedef {Object} CompilerVariable
 * @property {string} name
 * @property {string=} export_name
 * @property {boolean=} injected
 * @property {boolean=} module
 * @property {boolean=} mutated
 * @property {boolean=} reassigned
 * @property {boolean=} referenced
 * @property {boolean=} writable
 */

/**
 * @typedef {import("eslint-scope").Scope} Scope
 */

/**
 * @typedef {import("eslint-scope").Variable} ScopeVariable
 * @property {Scope} scope
 */
"use strict";

import { Variable as ScopeVariable } from "eslint-scope";

/**
 * Retrieves the top-level variable with the given name.
 *
 * @param {Scope} global_scope The global scope to search
 * @param {string} variable_name The name of the variable to find
 */
function get_variable(global_scope, variable_name) {
  let scope_variable = global_scope.set.get(variable_name);

  if (scope_variable) {
    return scope_variable;
  }

  const [module_scope] = global_scope.childScopes;
  if (module_scope && module_scope.type === "module") {
    scope_variable = module_scope.set.get(variable_name);
  }

  return scope_variable;
}

/**
 * Adds the given variable to the global scope.
 *
 * @param {Scope} global_scope The scope to add to
 * @param {ScopeVariable} scope_variable The scope variable to add
 */
function add_variable(global_scope, scope_variable) {
  global_scope.variables.push(scope_variable);
  global_scope.set.set(scope_variable.name, scope_variable);
}

/**
 * Removes the given variable from the given scope.
 *
 * @param {Scope} scope The scope to remove from
 * @param {ScopeVariable} scope_variable The scope variable to add
 */
function remove_variable(scope, scope_variable) {
  const variable_name = scope_variable.name;

  const index = scope.variables.indexOf(scope_variable);
  if (index === -1) {
    throw new Error(
      `Could not find variable '${variable_name}' in nested scope`
    );
  }
  scope.variables.splice(index, 1);

  scope.set.delete(variable_name);
}

/**
 * Hoists the given variable from its nested scope (if applicable) into the
 * global scope.
 *
 * @param {Scope} global_scope The scope to hoist the variable to
 * @param {ScopeVariable} scope_variable The variable to hoist
 */
function hoist_variable(global_scope, scope_variable) {
  const from_scope = scope_variable.scope;

  if (from_scope === global_scope) {
    return;
  }

  remove_variable(from_scope, scope_variable);
  scope_variable.scope = global_scope;
  add_variable(global_scope, scope_variable);
}

/**
 * The Svelte compiler injects variables and variable references based on store
 * auto-subscriptions and defined component properties. This updates the
 * provided global `Scope` instance to incorporate those implicit variables and
 * references.
 *
 * @param {Scope} global_scope The global scope
 * @param {CompilerVariable} compiler_variable The Svelte-provided variable
 *
 * @example
 * <script>
 *   import { readable } from "svelte/store";
 *
 *   // ESLint normally marks `count` as unused (`no-unused-vars`)
 *   // ESLint normally marks `$count` as not defined (`no-undef`)
 *   const count = readable(0);
 *
 *   // ESLint normally marks `multiplier` as not reassigned (`prefer-const`)
 *   export let multiplier = 2;
 * </script>
 * <div>{$count * 2}</div>
 */
function handle_compiler_variable(global_scope, compiler_variable) {
  const variable_name = compiler_variable.name;
  let scope_variable = get_variable(global_scope, variable_name);

  if (compiler_variable.injected && !scope_variable) {
    scope_variable = new ScopeVariable(variable_name, global_scope);
    scope_variable.eslintExplicitGlobal = false;
    add_variable(global_scope, scope_variable);
  }

  if (!scope_variable) {
    throw new Error(`Could not find scope variable '${variable_name}'`);
  }

  scope_variable.writeable = compiler_variable.writable;

  if (compiler_variable.referenced) {
    scope_variable.eslintUsed = true;
  }

  if (compiler_variable.export_name) {
    hoist_variable(global_scope, scope_variable);
    scope_variable.eslintUsed = true;
  }
}

export { handle_compiler_variable };
