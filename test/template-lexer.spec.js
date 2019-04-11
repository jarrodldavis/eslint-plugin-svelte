"use strict";

const { create_root_suite } = require("./helpers/create-baseline-suite");
const {
  template_lexer
} = require("../lib/parser/converter/helpers/template-lexer");

create_root_suite("template-lexer", template =>
  Array.from(template_lexer.reset(template))
);
