"use strict";

const { compile } = require("svelte/compiler");

const { convert } = require("./converter");
const { analyze } = require("./referencer");
const { ALL_SVELTE_KEYS } = require("./keys");

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

  const program = convert(code, options, result.ast);

  const scopeManager = analyze(program, options, result.vars);

  return {
    ast: program,
    services: { warnings: result.warnings, vars: result.vars },
    visitorKeys: ALL_SVELTE_KEYS,
    scopeManager
  };
}

module.exports = { parse };
