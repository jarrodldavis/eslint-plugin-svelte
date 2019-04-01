"use strict";

const { Converter } = require("./converter");

function convert(code, options, ast) {
  const ast_clone = JSON.parse(JSON.stringify(ast));
  ast_clone.type = "TemplateRoot";

  new Converter(code, options).visit(ast_clone);

  // re-normalize to plain objects
  return JSON.parse(JSON.stringify(ast_clone));
}

module.exports = { convert };
