"use strict";

const {
  template_lexer,
  TOKEN_TYPES: LEXER_TOKEN_TYPES
} = require("./template-lexer");

const CODE = Symbol("TagTokenizer.code");
const TOKENS = Symbol("TagTokenizer.tokens");

const ESPREE_TOKEN_TYPES = {
  Identifier: "Identifier",
  Keyword: "Keyword",
  Punctuator: "Punctuator"
};

const TOKEN_MAPPINGS = {
  [LEXER_TOKEN_TYPES.HTML_OPEN_START]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.HTML_OPEN_END]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.HTML_CLOSE_START]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.HTML_CLOSE_END]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.MUSTACHE_START]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.MUSTACHE_END]: ESPREE_TOKEN_TYPES.Punctuator,

  [LEXER_TOKEN_TYPES.IF_OPEN]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.ELSE_OPEN]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.ELSE_IF]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.IF_CLOSE]: ESPREE_TOKEN_TYPES.Keyword,

  [LEXER_TOKEN_TYPES.EACH_OPEN]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.EACH_AS]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.EACH_COMMA]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.EACH_INDEX_IDENTIFIER]: ESPREE_TOKEN_TYPES.Identifier,
  [LEXER_TOKEN_TYPES.EACH_KEY_START]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.EACH_KEY_END]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.EACH_KEY_AMPERSAT]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.EACH_KEY_IDENTIFIER]: ESPREE_TOKEN_TYPES.Identifier,
  [LEXER_TOKEN_TYPES.EACH_CLOSE]: ESPREE_TOKEN_TYPES.Keyword,

  [LEXER_TOKEN_TYPES.AWAIT_OPEN]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.AWAIT_COMPACT_THEN]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.AWAIT_FULL_THEN]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.AWAIT_THEN_IDENTIFIER]: ESPREE_TOKEN_TYPES.Identifier,
  [LEXER_TOKEN_TYPES.AWAIT_CATCH]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.AWAIT_CATCH_IDENTIFIER]: ESPREE_TOKEN_TYPES.Identifier,
  [LEXER_TOKEN_TYPES.AWAIT_CLOSE]: ESPREE_TOKEN_TYPES.Keyword,

  [LEXER_TOKEN_TYPES.RAW_HTML_START]: ESPREE_TOKEN_TYPES.Keyword,
  [LEXER_TOKEN_TYPES.DEBUG_START]: ESPREE_TOKEN_TYPES.Keyword
};

function TagTokenizerMixin(SuperClass) {
  return class TagTokenizer extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
      this[TOKENS] = options.tokens;
    }

    TemplateRoot() {
      template_lexer.reset(this[CODE]);
      for (const lexer_token of template_lexer) {
        if (lexer_token.type.startsWith("_")) {
          continue;
        }

        const espree_token = {
          type: TOKEN_MAPPINGS[lexer_token.type],
          start: lexer_token.offset,
          end: lexer_token.offset + lexer_token.value.length,
          value: lexer_token.value
        };

        this[TOKENS].push(espree_token);
      }
    }

    Text(node) {
      this[TOKENS].push({
        type: "Text",
        start: node.start,
        end: node.end,
        value: node.data
      });
    }

    Attribute(node) {
      this[TOKENS].push({
        type: "Text",
        start: node.start,
        end: node.start + node.name.length,
        value: node.name
      });
    }
  };
}

module.exports = { TagTokenizerMixin };
