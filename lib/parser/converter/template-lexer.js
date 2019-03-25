/* eslint-disable require-unicode-regexp */
"use strict";

const moo = require("moo");

// TODO: strings in expressions?

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
    html_open_start: { match: /<(?!\/)/, push: "html_open" },
    html_close_start: { match: /<\//, push: "html_close" },
    mustache_start: { match: /{/, lineBreaks: true, push: "mustache" }
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
    mustache_start: { match: /{/, push: "mustache" },
    html_open_end: { match: />/, pop: true }
  },
  html_close: {
    _html_close_contents: { match: /[^>]+/, lineBreaks: true },
    html_close_end: { match: />/, pop: true }
  },
  mustache: {
    _whitespace: { match: /(?<!})\s+/, lineBreaks: true },
    if_open: { match: /#if/, push: "if_open" },
    each_open: { match: /#each/, push: "each_open" },
    await_open: { match: /#await/, push: "await_open" },
    else_open: { match: /:else/, push: "else_open" },
    then_open: { match: /:then/, push: "then_open" },
    catch_open: { match: /:catch/, push: "catch_open" },
    if_close: { match: /\/if/, push: "mustache_close_end" },
    each_close: { match: /\/each/, push: "mustache_close_end" },
    await_close: { match: /\/await/, push: "mustache_close_end" },
    raw_html_start: { match: /@html/, push: "raw_html_tag" },
    debug_start: { match: /@debug/, push: "debug_tag" },
    _mustache_tag_start: { match: /(?<={)/, push: "mustache_tag" },
    _mustache_end: { match: /(?<=})/, pop: true }
  },
  if_open: {
    _left_brace: { match: /{/, push: "nested_brace" },
    // if expressions are tokenized separately by espree
    _if_expression: { match: /[^{}]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  each_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    // each expressions are tokenized separately by espree
    _each_expression: { match: /[^{}]+(?=\s*as)/, lineBreaks: true },
    each_as: { match: /as/ },
    // each context expressions are tokenized separately by espree
    _each_context: { match: /[^{}[\](),@]+/, lineBreaks: true },
    _lbracket: { match: /\[/, push: "nested_bracket" },
    each_comma: { match: /,/, push: "each_index" },
    each_key_start: { match: /\(/, push: "each_paren_key" },
    each_ampersat: { match: /@/, push: "each_ampersat_key" },
    mustache_end: { match: /}/, pop: true }
  },
  each_index: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // each index expressions are only simple identifiers
    each_index_identifier: { match: /(?<=,\s*)[^{}()@\s]+/, pop: true }
  },
  each_paren_key: {
    // parenthesized each key expressions are tokenized separately by espree
    _each_key: { match: /[^()]+/, lineBreaks: true },
    _left_paren: { match: /\(/, push: "nested_paren" },
    each_key_end: { match: /\)/, pop: true }
  },
  each_ampersat_key: {
    // ampersat-prefixed each key expressions are only simple identifiers
    each_key_identifier: { match: /(?<=@)[^\s}]+/, pop: true }
  },
  await_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    // await promise expressions are tokenized separately by espree
    _promise_expression_compact: { match: /[^{}]+(?=then)/, lineBreaks: true },
    await_then: { match: /then/ },
    // then expressions are only simple identifiers
    await_then_identifier: { match: /(?<=then\s*)[^{}\s]+/, lineBreaks: true },
    // await promise expressions are tokenized separately by espree
    _promise_expression_full: { match: /[^{}]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  else_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    else_if_start: { match: /if(?=\s+)/ },
    // else if expressions are tokenized separately by espree
    _else_if_expression: { match: /[^{}]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  then_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // then expressions are only simple identifiers
    await_then_identifier: { match: /[^{}\s]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  catch_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // catch expressions are only simple identifiers
    await_catch_identifier: { match: /[^{}\s]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  debug_tag: {
    // debug identifiers are tokenized separately by espree
    _debug_identifiers: { match: /[^}]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  raw_html_tag: {
    // raw html expressions are tokenized separately by espree
    _raw_html_expression: { match: /[^}]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  mustache_tag: {
    _left_brace: { match: /{/, push: "nested_brace" },
    // mustache expressions are tokenized separately by espree
    _mustache_expression: { match: /[^}]+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  },
  nested_brace: {
    _left_brace: { match: /{/, push: "nested_brace" },
    _right_brace: { match: /}/, pop: true },
    _brace_contents: { match: /[^{}]+/, lineBreaks: true }
  },
  nested_bracket: {
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    _right_bracket: { match: /]/, pop: 1 },
    _bracket_contents: { match: /[^[\]]+/, lineBreaks: true }
  },
  nested_paren: {
    _left_paren: { match: /\(/, push: "nested_paren" },
    _right_paren: { match: /\)/, pop: 1 },
    _paren_contents: { match: /[^()]+/, lineBreaks: true }
  },
  mustache_close_end: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    mustache_end: { match: /}/, pop: true }
  }
});

module.exports = { template_lexer };
