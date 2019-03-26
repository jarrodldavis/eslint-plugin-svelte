/* eslint-disable require-unicode-regexp */
"use strict";

const moo = require("moo");

const HTML_OPEN_START = "html_open_start";
const HTML_OPEN_END = "html_open_end";
const HTML_CLOSE_START = "html_close_start";
const HTML_CLOSE_END = "html_close_end";
const MUSTACHE_START = "mustache_start";
const MUSTACHE_END = "mustache_end";

const IF_OPEN = "if_open";
const ELSE_OPEN = "else_open";
const ELSE_IF = "else_if";
const IF_CLOSE = "if_close";

const EACH_OPEN = "each_open";
const EACH_AS = "each_as";
const EACH_COMMA = "each_comma";
const EACH_INDEX_IDENTIFIER = "each_index_identifier";
const EACH_KEY_START = "each_key_start";
const EACH_KEY_END = "each_key_end";
const EACH_KEY_AMPERSAT = "each_key_ampersat";
const EACH_KEY_IDENTIFIER = "each_key_identifier";
const EACH_CLOSE = "each_close";

const AWAIT_OPEN = "await_open";
const AWAIT_COMPACT_THEN = "await_compact_then";
const AWAIT_FULL_THEN = "await_full_then";
const AWAIT_THEN_IDENTIFIER = "await_then_identifier";
const AWAIT_CATCH = "await_catch";
const AWAIT_CATCH_IDENTIFIER = "await_catch_identifier";
const AWAIT_CLOSE = "await_close";

const RAW_HTML_START = "raw_html_start";
const DEBUG_START = "debug_start";

const template_lexer = moo.states({
  main: {
    _body: { match: /[^<{]+/, lineBreaks: true },
    _script_start_tag: {
      match: /<\s*script[^>]*>/,
      lineBreaks: true,
      push: "script_block"
    },
    _style_start_tag: {
      match: /<\s*style[^>]*>/,
      lineBreaks: true,
      push: "style_block"
    },
    [HTML_OPEN_START]: { match: /<(?!\/)/, push: "html_open" },
    [HTML_CLOSE_START]: { match: /<\//, push: "html_close" },
    [MUSTACHE_START]: { match: /{/, lineBreaks: true, push: "mustache" }
  },
  script_block: {
    _script_body: { match: /[\s\S]+?(?=<\/\s*script[^>]*>)/, lineBreaks: true },
    _end_script_tag: {
      match: /<\/\s*script[^>]*>/,
      lineBreaks: true,
      pop: true
    }
  },
  style_block: {
    _style_body: { match: /[\s\S]+?(?=<\/\s*style[^>]*>)/, lineBreaks: true },
    _end_style_tag: { match: /<\/\s*style[^>]*>/, lineBreaks: true, pop: true }
  },
  html_open: {
    _html_open_contents: { match: /[^{>]+/, lineBreaks: true },
    [MUSTACHE_START]: { match: /{/, push: "mustache" },
    [HTML_OPEN_END]: { match: />/, pop: true }
  },
  html_close: {
    _html_close_contents: { match: /[^>]+/, lineBreaks: true },
    [HTML_CLOSE_END]: { match: />/, pop: true }
  },
  mustache: {
    _whitespace: { match: /(?<!})\s+/, lineBreaks: true },
    [IF_OPEN]: { match: /#if/, push: "if_open" },
    [EACH_OPEN]: { match: /#each/, push: "each_open" },
    [AWAIT_OPEN]: { match: /#await/, push: "await_open" },
    [ELSE_OPEN]: { match: /:else/, push: "else_open" },
    [AWAIT_FULL_THEN]: { match: /:then/, push: "then_open" },
    [AWAIT_CATCH]: { match: /:catch/, push: "catch_open" },
    [IF_CLOSE]: { match: /\/if/, push: "mustache_close_end" },
    [EACH_CLOSE]: { match: /\/each/, push: "mustache_close_end" },
    [AWAIT_CLOSE]: { match: /\/await/, push: "mustache_close_end" },
    [RAW_HTML_START]: { match: /@html/, push: "raw_html_tag" },
    [DEBUG_START]: { match: /@debug/, push: "debug_tag" },
    _simple_tag_start: { match: /(?<={)/, push: "simple_expression_tag" },
    _mustache_end: { match: /(?<=})/, pop: true }
  },
  if_open: {
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    // if expressions are tokenized separately by espree
    _if_expression: { match: /[^{}"']+/, lineBreaks: true },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  each_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _each_expression_start: { match: /(?<=#each\s*)/, push: "each_expression" },
    _each_context_start: { match: /(?<=as\s*)/, push: "each_context" },
    [EACH_COMMA]: { match: /,/, push: "each_index" },
    [EACH_KEY_START]: { match: /\(/, push: "each_paren_key" },
    [EACH_KEY_AMPERSAT]: { match: /@/, push: "each_ampersat_key" },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  each_expression: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    // each expressions are tokenized separately by espree
    _each_expression: { match: /(?:(?!as)[^{}[\]"'])+/, lineBreaks: true },
    [EACH_AS]: { match: /as/, pop: true }
  },
  each_context: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    // each context expressions are tokenized separately by espree
    _each_context: { match: /[^{}[\]"'(),@]+/, lineBreaks: true },
    _each_context_end: { match: /(?=,|\(|@|})/, pop: true }
  },
  each_index: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // each index expressions are only simple identifiers
    [EACH_INDEX_IDENTIFIER]: { match: /[^{}()@\s]+/, pop: true }
  },
  each_paren_key: {
    // parenthesized each key expressions are tokenized separately by espree
    _each_key: { match: /[^()"']+/, lineBreaks: true },
    _left_paren: { match: /\(/, push: "nested_paren" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    [EACH_KEY_END]: { match: /\)/, pop: true }
  },
  each_ampersat_key: {
    // ampersat-prefixed each key expressions are only simple identifiers
    [EACH_KEY_IDENTIFIER]: { match: /[^\s}]+/, pop: true }
  },
  await_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _await_expression_start: {
      match: /(?<=#await\s*)/,
      push: "await_expression"
    },
    _await_then_compact_start: {
      match: /(?<=then\s*)/,
      push: "await_then_compact"
    },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  await_expression: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    // await promise expressions are tokenized separately by espree
    _await_promise_expression: {
      match: /(?:(?!then)[^{}[\]"'])+/,
      lineBreaks: true
    },
    [AWAIT_COMPACT_THEN]: { match: /then/, pop: true },
    _await_promise_full_end: { match: /(?=})/, pop: true }
  },
  await_then_compact: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // then expressions are only simple identifiers
    [AWAIT_THEN_IDENTIFIER]: { match: /[^{}\s]+/, lineBreaks: true, pop: true }
  },
  else_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    [ELSE_IF]: { match: /if/, push: "else_if_expression" },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  else_if_expression: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    // else if expressions are tokenized separately by espree
    _else_if_expression: { match: /[^{}"']+/, lineBreaks: true },
    _else_if_end: { match: /(?=})/, pop: true }
  },
  then_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // then expressions are only simple identifiers
    [AWAIT_THEN_IDENTIFIER]: { match: /[^{}\s]+/, lineBreaks: true },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  catch_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // catch expressions are only simple identifiers
    [AWAIT_CATCH_IDENTIFIER]: { match: /[^{}\s]+/, lineBreaks: true },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  debug_tag: {
    // debug identifiers are tokenized separately by espree
    _debug_identifiers: { match: /[^}]+/, lineBreaks: true },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  raw_html_tag: {
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    // raw html expressions are tokenized separately by espree
    _raw_html_expression: { match: /[^{}"']+/, lineBreaks: true },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },
  simple_expression_tag: {
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    // simple mustache expressions are tokenized separately by espree
    _simple_mustache_expression: { match: /[^{}"']+/, lineBreaks: true },
    [MUSTACHE_END]: { match: /}/, pop: true }
  },

  // used in all expressions to prevent mis-tokenization of nested closing braces as terminations of mustache tags
  // used in each expressions to prevent mis-tokenization of in-brace "as" character sequences as terminations of each expressions (and the start of each context expressions)
  // used in each context expressions to prevent mis-tokenization of in-brace commas, opening parens, or ampersats as terminations of each context expressions (and the start of each index expressions or key expressions, respectively)
  // used in await expressions to prevent mis-tokenization of in-brace "then" character sequences as terminations of await expressions (and the start of compact then expressions)
  nested_brace: {
    _left_brace: { match: /{/, push: "nested_brace" },
    _right_brace: { match: /}/, pop: true },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    _brace_contents: { match: /[^{}"']+/, lineBreaks: true }
  },

  // used in each expressions to prevent mis-tokenization of in-bracket "as" character sequences as terminations of each expressions (and the start of each context expressions)
  // used in each context expressions to prevent mis-tokenization of in-bracket commas, opening parens, or ampersats as terminations of each context expressions (and the start of each index expressions or key expressions, respectively)
  // used in await expressions to prevent mis-tokenization of in-bracket "then" character sequences as terminations of await expressions (and the start of compact then expressions)
  nested_bracket: {
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    _right_bracket: { match: /]/, pop: true },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    _bracket_contents: { match: /[^[\]"']+/, lineBreaks: true }
  },

  // used in each key expressions to prevent mis-tokenization of nested closing parens as terminations of each key expressions
  nested_paren: {
    _left_paren: { match: /\(/, push: "nested_paren" },
    _right_paren: { match: /\)/, pop: true },
    _left_double_quote: { match: /"/, push: "nested_double_string" },
    _left_single_quote: { match: /'/, push: "nested_single_string" },
    _paren_contents: { match: /[^()"']+/, lineBreaks: true }
  },

  // used in all expressions to prevent mis-tokenization of in-string closing braces as terminiations of mustache tags
  // used in each expressions to prevent mis-tokenization of in-string "as" character sequences as terminations of each expressions (and the start of each context expressions)
  // used in each context expressions to prevent mis-tokenization of in-string commas, opening parens, or ampersats as terminations of each context expressions (and the start of each index expressions or key expressions, respectively)
  // used in each key expressions to prevent mis-tokenization of in-string closing parens as terminations of each key expressions
  // used in await expressions to prevent mis-tokenization of in-string "then" character sequences as terminations of await expressions (and the start of compact then expressions)
  // used by nested brace/bracket/paren states to prevent mis-tokenization of in-string closing braces/brackets/parens as terminations of those nested states
  nested_double_string: {
    _double_string_contents: { match: /[^"]/, lineBreaks: true },
    _escaped_double_quote: { match: /\\"/ },
    _right_double_quote: { match: /(?<!\\)"/, pop: true }
  },

  // used in all expressions to prevent mis-tokenization of in-string closing braces as terminiation of mustache tags
  // used in each expressions to prevent mis-tokenization of in-string "as" character sequences as terminations of each expressions (and the start of each context expressions)
  // used in each context expressions to prevent mis-tokenization of in-string commas, opening parens, or ampersats as terminations of each context expressions (and the start of each index expressions or key expressions, respectively)
  // used in each key expressions to prevent mis-tokenization of in-string closing parens as terminations of each key expressions
  // used in await expressions to prevent mis-tokenization of in-string "then" character sequences as terminations of await expressions (and the start of compact then expressions)
  // used by nested brace/bracket/paren states to prevent mis-tokenization of in-string closing braces/brackets/parens as terminations of those nested states
  nested_single_string: {
    _single_string_contents: { match: /[^']/, lineBreaks: true },
    _escaped_single_quote: { match: /\\'/ },
    _right_single_quote: { match: /(?<!\\)'/, pop: true }
  },
  mustache_close_end: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    [MUSTACHE_END]: { match: /}/, pop: true }
  }
});

module.exports = { template_lexer };
