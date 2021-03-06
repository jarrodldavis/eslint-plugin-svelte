"use strict";

const LEXER_TOKEN_TYPES = {
  HTML_OPEN_START: "html_open_start",
  HTML_TAG_NAME: "html_tag_name",
  COMPONENT_IDENTIFIER: "html_component_identifier",
  ATTRIBUTE_NAME: "html_attribute_name",
  DIRECTIVE_COLON: "html_directive_colon",
  DIRECTIVE_IDENTIFIER: "html_directive_identifier",
  DIRECTIVE_PIPE: "html_directive_pipe",
  DIRECTIVE_MODIFIER: "html_directive_modifier",
  ATTRIBUTE_EQUAL: "html_attribute_equal",
  ATTRIBUTE_VALUE: "html_attribute_value",
  ATTRIBUTE_DOUBLE_QUOTE: "html_attribute_double_quote",
  ATTRIBUTE_SINGLE_QUOTE: "html_attribute_single_quote",
  HTML_OPEN_END: "html_open_end",
  HTML_CLOSE_START: "html_close_start",
  HTML_CLOSE_END: "html_close_end",
  MUSTACHE_START: "mustache_start",
  MUSTACHE_END: "mustache_end",

  IF_OPEN: "if_open",
  ELSE_OPEN: "else_open",
  ELSE_IF: "else_if",
  IF_CLOSE: "if_close",

  EACH_OPEN: "each_open",
  EACH_AS: "each_as",
  EACH_COMMA: "each_comma",
  EACH_INDEX_IDENTIFIER: "each_index_identifier",
  EACH_KEY_START: "each_key_start",
  EACH_KEY_END: "each_key_end",
  EACH_KEY_AMPERSAT: "each_key_ampersat",
  EACH_KEY_IDENTIFIER: "each_key_identifier",
  EACH_CLOSE: "each_close",

  AWAIT_OPEN: "await_open",
  AWAIT_COMPACT_THEN: "await_compact_then",
  AWAIT_FULL_THEN: "await_full_then",
  AWAIT_THEN_IDENTIFIER: "await_then_identifier",
  AWAIT_CATCH: "await_catch",
  AWAIT_CATCH_IDENTIFIER: "await_catch_identifier",
  AWAIT_CLOSE: "await_close",

  RAW_HTML_START: "raw_html_start",
  DEBUG_START: "debug_start"
};

const ESPREE_TOKEN_TYPES = {
  Identifier: "Identifier",
  Keyword: "Keyword",
  Punctuator: "Punctuator",
  String: "String"
};

const TOKEN_MAPPINGS = {
  [LEXER_TOKEN_TYPES.HTML_OPEN_START]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.HTML_TAG_NAME]: ESPREE_TOKEN_TYPES.String,
  [LEXER_TOKEN_TYPES.COMPONENT_IDENTIFIER]: ESPREE_TOKEN_TYPES.Identifier,
  [LEXER_TOKEN_TYPES.ATTRIBUTE_NAME]: ESPREE_TOKEN_TYPES.String,
  [LEXER_TOKEN_TYPES.DIRECTIVE_COLON]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.DIRECTIVE_IDENTIFIER]: ESPREE_TOKEN_TYPES.Identifier,
  [LEXER_TOKEN_TYPES.DIRECTIVE_PIPE]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.DIRECTIVE_MODIFIER]: ESPREE_TOKEN_TYPES.String,
  [LEXER_TOKEN_TYPES.ATTRIBUTE_EQUAL]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.ATTRIBUTE_VALUE]: ESPREE_TOKEN_TYPES.String,
  [LEXER_TOKEN_TYPES.ATTRIBUTE_DOUBLE_QUOTE]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.ATTRIBUTE_SINGLE_QUOTE]: ESPREE_TOKEN_TYPES.Punctuator,
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

module.exports = { LEXER_TOKEN_TYPES, ESPREE_TOKEN_TYPES, TOKEN_MAPPINGS };
