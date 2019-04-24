"use strict";

const { compile } = require("svelte/compiler");

const { create_root_suite } = require("./helpers/create-baseline-suite");
const { convert } = require("../lib/parser/converter");

const PARSER_OPTIONS = {
  ecmaVersion: 9,
  sourceType: "module",
  ecmaFeatures: { globalReturn: false },
  loc: true,
  range: true,
  raw: true,
  tokens: true,
  comment: true,
  eslintVisitorKeys: true,
  eslintScopeManager: true
};

create_root_suite("converter", (template, filePath) => {
  let result = null;

  try {
    result = compile(template, { generate: false });
  } catch (error) {
    return error;
  }

  const options = { ...PARSER_OPTIONS, filePath };
  return convert(template, options, result.ast);
});
