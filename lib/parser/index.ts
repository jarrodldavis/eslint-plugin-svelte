"use strict";

import { compile } from "svelte/compiler";

import { convert } from "./converter";
import { analyze } from "./referencer";
import { ALL_SVELTE_KEYS } from "./keys";

function compile_template(code) {
  try {
    return compile(code, { generate: false });
  } catch (error) {
    if (!error.start) {
      throw error;
    }

    if (error.code) {
      error.message = `${error.code}: ${error.message}`;
    }

    const { line, column, character } = error.start;
    error.lineNumber = line;
    error.column = column;
    error.index = character;
    throw error;
  }
}

function parse(code, options) {
  const result = compile_template(code);

  const {
    html: program,
    css,
    instance: js_instance,
    module: js_module
  } = convert(code, options, result.ast);

  const scopeManager = analyze(program, options, result.vars);

  return {
    ast: program,
    services: {
      warnings: result.warnings,
      vars: result.vars,
      css,
      js_instance,
      js_module
    },
    visitorKeys: ALL_SVELTE_KEYS,
    scopeManager
  };
}

export { parse };
