/* eslint-disable max-statements */
"use strict";

const { compile } = require("svelte/compiler");

const { SourceCode } = require("./source-code");
const { Converter } = require("./converter");
const { analyze } = require("./referencer");
const { KEYS } = require("./keys");

function parse(code, options) {
  let result = null;
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

  result.ast.type = "TemplateRoot";
  const converter = new Converter(new SourceCode(code), options);
  converter.visit(result.ast);

  const {
    html: program,
    css,
    instance: js_instance,
    module: js_module
  } = result.ast;

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
