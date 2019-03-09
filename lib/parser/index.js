const { compile } = require("svelte/compiler");

const { convert } = require("./convert-ast");
const { analyze } = require("./referencer");
const { KEYS } = require("./keys");

function parse(code, options) {
  let result;
  try {
    result = compile(code, { generate: false });
  } catch (error) {
    if (!error.start) {
      throw error;
    }

    const { line, column, character } = error.start;
    error.lineNumber = line;
    error.column = column;
    error.index = character;
    throw error;
  }

  const { program, css, js_instance, js_module } = convert(
    result.ast,
    code,
    options
  );
  const scopeManager = analyze(program, options);

  return {
    ast: program,
    services: {
      warnings: result.warnings,
      vars: result.vars,
      css,
      js_instance,
      js_module
    },
    visitorKeys: KEYS,
    scopeManager
  };
}

module.exports = { parse };
