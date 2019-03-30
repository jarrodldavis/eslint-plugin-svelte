"use strict";

const { get_parser } = require("./helpers/espree");

const CODE = Symbol("ScriptBlockParser.code");
const PARSER_OPTIONS = Symbol("ScriptBlockParser.parser_options");
const TOKENS = Symbol("ScriptBlockParser.tokens");
const COMMENTS = Symbol("ScriptBlockParser.comments");

function ScriptBlockParserMixin(SuperClass) {
  return class ScriptBlockParser extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
      this[PARSER_OPTIONS] = options.parser_options;
      this[TOKENS] = options.tokens;
      this[COMMENTS] = options.comments;
    }

    "ScriptElement > .content"(node) {
      const Parser = get_parser(node.start);
      const program = Parser.parse(
        this[CODE].slice(0, node.end),
        this[PARSER_OPTIONS]
      );

      this[TOKENS].push(...program.tokens);
      this[COMMENTS].push(...program.comments);
      return program;
    }
  };
}

module.exports = { ScriptBlockParserMixin };
