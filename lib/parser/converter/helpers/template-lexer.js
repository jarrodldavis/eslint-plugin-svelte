/* eslint-disable max-lines, require-unicode-regexp */
"use strict";

const moo = require("moo");

const { LEXER_TOKEN_TYPES: TOKENS } = require("./token-mappings");

const template_lexer = moo.states({
  $all: { error: moo.error },
  main: {
    _body: { match: /[^<{]+/, lineBreaks: true },
    _script_start_tag: {
      match: /<script(?:>|\s[^>]*>)/,
      lineBreaks: true,
      push: "script_block"
    },
    _style_start_tag: {
      match: /<style(?:>|\s[^>]*)>/,
      lineBreaks: true,
      push: "style_block"
    },
    _comment_start: { match: /<!--/, push: "comment" },
    [TOKENS.HTML_OPEN_START]: { match: /<(?!\/)/, push: "html_open" },
    [TOKENS.HTML_CLOSE_START]: { match: /<\//, push: "html_close" },
    [TOKENS.MUSTACHE_START]: { match: /{/, lineBreaks: true, push: "mustache" }
  },
  script_block: {
    _script_body: { match: /(?:(?!<\/script>)[\s\S])+/, lineBreaks: true },
    _end_script_tag: { match: /<\/script>/, lineBreaks: true, pop: true }
  },
  style_block: {
    _style_body: { match: /(?:(?!<\/style>)[\s\S])+/, lineBreaks: true },
    _end_style_tag: { match: /<\/style>/, lineBreaks: true, pop: true }
  },
  comment: {
    _comment_contents: { match: /(?:(?!-->)[\s\S])+/, lineBreaks: true },
    _comment_end: { match: /-->/, pop: true }
  },
  html_open: {
    [TOKENS.COMPONENT_IDENTIFIER]: {
      match: /[A-Z][^\s/>]*/,
      push: "html_attributes"
    },
    [TOKENS.HTML_TAG_NAME]: {
      match: /[^A-Z\s/>][^\s/>]*/,
      push: "html_attributes"
    },
    [TOKENS.HTML_OPEN_END]: { match: /\/?>/, pop: true }
  },
  html_attributes: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _html_attribute_start: {
      match: /(?=(?![/>])[\S])/,
      push: "html_attribute"
    },
    _html_attributes_end: { match: /(?=[/>])/, pop: true }
  },
  html_attribute: {
    [TOKENS.MUSTACHE_START]: { match: /{/, push: "mustache" },
    _html_attribute_name_start: {
      match: /(?=(?![{}=/>])[\S])/,
      push: "html_attribute_name"
    },
    [TOKENS.ATTRIBUTE_EQUAL]: { match: /[=]/, push: "html_attribute_value" },
    _html_attribute_end: { match: /(?=[\s/>])/, lineBreaks: true, pop: true }
  },
  html_attribute_name: {
    /**
     * Currently, the Svelte compiler doesn't throw a parse error on unexpected
     * quotes or pipes in HTML tags. If a quote or pipe is encountered by the
     * lexer in an attribute name before a directive identifier, `moo` will
     * throw an error since this token forbids single and double quotes and
     * there's no other token in this state that allows them.
     *
     * Since quotes in attribute names tend to cause code generation issues,
     * this lexer is being written to treat them as syntax errors.
     *
     * While pipes generally don't cause code generation issues, their presence
     * in an attribute name before a directive identifier indicates a mis-typed
     * directive.
     */
    [TOKENS.ATTRIBUTE_NAME]: { match: /[^'":|=\s/>]+/ },
    /**
     * Currently, the Svelte compiler doesn't throw a parse error on unexpected
     * colons in HTML tags. If a colon is encountered by the lexer at the start
     * or end of an attribute, `moo` will throw an error since this token
     * requires colons to be predeced by non-whitespace characters.
     *
     * While colons generally don't cause code generation issues, their presence
     * at the beginning or end of an attribute (rather within an attribute name)
     * indicates a mis-typed directive.
     */
    [TOKENS.DIRECTIVE_COLON]: {
      match: /(?<!\s):(?!\s)/,
      push: "html_directive_identifier"
    },
    _html_attribute_name_end: {
      match: /(?=[=\s/>])/,
      lineBreaks: true,
      pop: true
    }
  },
  html_directive_identifier: {
    /**
     * Currently, the Svelte compiler doesn't throw a parse error on unexpected
     * quotes or mustache tags in HTML tags. If a quote or brace is encountered
     * by the lexer in a directive identifier, `moo` will throw an error since
     * this token forbids quotes and braces and there's no other token in this
     * state that allows them.
     *
     * While quotes and braces in directive identifiers generally don't cause
     * code generation issues, their presence in a directive identifier
     * indicates a mis-typed directive.
     */
    [TOKENS.DIRECTIVE_IDENTIFIER]: {
      match: /[^{}'"|=\s/>]+(?=[|=\s/>])/
    },
    [TOKENS.DIRECTIVE_PIPE]: { match: /\|/, push: "html_directive_modifiers" },
    _html_directive_identifier_end: {
      match: /(?=[=\s/>])/,
      lineBreaks: true,
      pop: true
    }
  },
  html_directive_modifiers: {
    /**
     * Currently, the Svelte compiler doesn't throw a parse error on unexpected
     * quotes or mustache tags in HTML tags. If a quote or brace is encountered
     * by the lexer in a directive modifier, `moo` will throw an error since
     * this token forbids quotes and braces and there's no other token in this
     * state that allows them.
     *
     * While quotes and braces in directive modifiers generally don't cause code
     * generation issues, their presence in a directive modifier indicates a
     * mis-typed directive.
     */
    [TOKENS.DIRECTIVE_MODIFIER]: {
      match: /[^{}'"|=\s/>]+(?=[|=\s/>])/
    },
    [TOKENS.DIRECTIVE_PIPE]: { match: /\|/ },
    _html_directive_modifiers_end: {
      match: /(?=[=\s/>])/,
      lineBreaks: true,
      pop: true
    }
  },
  html_attribute_value: {
    [TOKENS.MUSTACHE_START]: { match: /{/, push: "mustache" },
    [TOKENS.ATTRIBUTE_DOUBLE_QUOTE]: {
      match: /"/,
      push: "html_attribute_double_string"
    },
    [TOKENS.ATTRIBUTE_SINGLE_QUOTE]: {
      match: /'/,
      push: "html_attribute_single_string"
    },
    /**
     * Currently, the Svelte compiler doesn't throw a parse error on unexpected
     * quotes or mustache tags in HTML tags. If a quote or opening brace is
     * encountered by the lexer in a bare attribute value (i.e. un-quoted and
     * un-braced), `moo` will throw an error since this token only matches a
     * bare attribute value that doesn't contain quotes or braces.
     *
     * Since quotes or braces in the middle of attribute values tend to cause
     * code generation issues, this lexer is being written to treat them as
     * syntax errors. Quotes and braces should either not be present in the
     * attribute value at all, or be the entire (start-to-finish) value (as
     * matched by the previous tokens in this lexer state). For mustache tags
     * (braces), they can be wrapped in quotes if part of the attribute value
     * is static, e.g. (`<div attr="static_{dynamic}" />`).
     */
    [TOKENS.ATTRIBUTE_VALUE]: { match: /(?<==)[^{}'"\s/>]+(?=[\s/>])/ },
    _html_attribute_value_end: {
      match: /(?=[\s/>])/,
      lineBreaks: true,
      pop: true
    }
  },
  html_attribute_double_string: {
    [TOKENS.ATTRIBUTE_VALUE]: { match: /[^"{}]+/, lineBreaks: true },
    [TOKENS.MUSTACHE_START]: { match: /{/, push: "mustache" },
    /**
     * Currently, the Svelte compiler doesn't throw a parse error on unexpected
     * quotes in HTML tags. If an esacped quote is encountered by the lexer in
     * an attribute value, `moo` will throw an error since this token forbids
     * escaped quotes and there's no other token in this state that allows them.
     *
     * Since escaped quotes in attribute values tend to cause code generation
     * issues, this lexer is being written to treat them as syntax errors.
     */
    [TOKENS.ATTRIBUTE_DOUBLE_QUOTE]: { match: /(?<!\\)"/, pop: true }
  },
  html_attribute_single_string: {
    [TOKENS.ATTRIBUTE_VALUE]: { match: /[^'{}]+/, lineBreaks: true },
    [TOKENS.MUSTACHE_START]: { match: /{/, push: "mustache" },
    /**
     * Currently, the Svelte compiler doesn't throw a parse error on unexpected
     * quotes in HTML tags. If an esacped quote is encountered by the lexer in
     * an attribute value, `moo` will throw an error since this token forbids
     * escaped quotes and there's no other token in this state that allows them.
     *
     * Since escaped quotes in attribute values tend to cause code generation
     * issues, this lexer is being written to treat them as syntax errors.
     */
    [TOKENS.ATTRIBUTE_SINGLE_QUOTE]: { match: /(?<!\\)'/, pop: true }
  },
  html_close: {
    [TOKENS.HTML_TAG_NAME]: { match: /[^\s>]+/, push: "html_close_whitespace" },
    [TOKENS.HTML_CLOSE_END]: { match: />/, pop: true }
  },
  html_close_whitespace: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _html_close_end: { match: /(?=>)/, pop: true }
  },
  mustache: {
    _whitespace: { match: /(?<!})\s+/, lineBreaks: true },
    [TOKENS.IF_OPEN]: { match: /#if/, push: "if_open" },
    [TOKENS.EACH_OPEN]: { match: /#each/, push: "each_open" },
    [TOKENS.AWAIT_OPEN]: { match: /#await/, push: "await_open" },
    [TOKENS.ELSE_OPEN]: { match: /:else/, push: "else_open" },
    [TOKENS.AWAIT_FULL_THEN]: { match: /:then/, push: "then_open" },
    [TOKENS.AWAIT_CATCH]: { match: /:catch/, push: "catch_open" },
    [TOKENS.IF_CLOSE]: { match: /\/if/, push: "mustache_close_end" },
    [TOKENS.EACH_CLOSE]: { match: /\/each/, push: "mustache_close_end" },
    [TOKENS.AWAIT_CLOSE]: { match: /\/await/, push: "mustache_close_end" },
    [TOKENS.RAW_HTML_START]: { match: /@html/, push: "raw_html_tag" },
    [TOKENS.DEBUG_START]: { match: /@debug/, push: "debug_tag" },
    _simple_tag_start: { match: /(?<={\s*)/, push: "simple_expression_tag" },
    _mustache_end: { match: /(?<=})/, pop: true }
  },
  if_open: {
    include: "nested_string",
    _left_brace: { match: /{/, push: "nested_brace" },
    // if expressions are tokenized separately by espree
    _if_expression: { match: /[^{}"']+/, lineBreaks: true },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  each_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    _each_expression_start: { match: /(?<=#each\s*)/, push: "each_expression" },
    _each_context_start: { match: /(?<=as\s*)/, push: "each_context" },
    [TOKENS.EACH_COMMA]: { match: /,/, push: "each_index" },
    [TOKENS.EACH_KEY_START]: { match: /\(/, push: "each_paren_key" },
    [TOKENS.EACH_KEY_AMPERSAT]: { match: /@/, push: "each_ampersat_key" },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  each_expression: {
    include: "nested_string",
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    // each expressions are tokenized separately by espree
    _each_expression: { match: /(?:(?!as)[^{}[\]"'])+/, lineBreaks: true },
    [TOKENS.EACH_AS]: { match: /as/, pop: true }
  },
  each_context: {
    include: "nested_string",
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    // each context expressions are tokenized separately by espree
    _each_context: { match: /[^{}[\]"'(),@]+/, lineBreaks: true },
    _each_context_end: { match: /(?=,|\(|@|})/, pop: true }
  },
  each_index: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // each index expressions are only simple identifiers
    [TOKENS.EACH_INDEX_IDENTIFIER]: { match: /[^{}()@\s]+/, pop: true }
  },
  each_paren_key: {
    include: "nested_string",
    // parenthesized each key expressions are tokenized separately by espree
    _each_key: { match: /[^()"']+/, lineBreaks: true },
    _left_paren: { match: /\(/, push: "nested_paren" },
    [TOKENS.EACH_KEY_END]: { match: /\)/, pop: true }
  },
  each_ampersat_key: {
    // ampersat-prefixed each key expressions are only simple identifiers
    [TOKENS.EACH_KEY_IDENTIFIER]: { match: /[^\s}]+/, pop: true }
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
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  await_expression: {
    include: "nested_string",
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    // await promise expressions are tokenized separately by espree
    _await_promise_expression: {
      match: /(?:(?!then)[^{}[\]"'])+/,
      lineBreaks: true
    },
    [TOKENS.AWAIT_COMPACT_THEN]: { match: /then/, pop: true },
    _await_promise_full_end: { match: /(?=})/, pop: true }
  },
  await_then_compact: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // then expressions are only simple identifiers
    [TOKENS.AWAIT_THEN_IDENTIFIER]: {
      match: /[^{}\s]+/,
      lineBreaks: true,
      pop: true
    }
  },
  else_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    [TOKENS.ELSE_IF]: { match: /if/, push: "else_if_expression" },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  else_if_expression: {
    include: "nested_string",
    _whitespace: { match: /\s+/, lineBreaks: true },
    _left_brace: { match: /{/, push: "nested_brace" },
    // else if expressions are tokenized separately by espree
    _else_if_expression: { match: /[^{}"']+/, lineBreaks: true },
    _else_if_end: { match: /(?=})/, pop: true }
  },
  then_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // then expressions are only simple identifiers
    [TOKENS.AWAIT_THEN_IDENTIFIER]: { match: /[^{}\s]+/, lineBreaks: true },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  catch_open: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    // catch expressions are only simple identifiers
    [TOKENS.AWAIT_CATCH_IDENTIFIER]: { match: /[^{}\s]+/, lineBreaks: true },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  debug_tag: {
    // debug identifiers are tokenized separately by espree
    _debug_identifiers: { match: /[^}]+/, lineBreaks: true },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  raw_html_tag: {
    include: "nested_string",
    _left_brace: { match: /{/, push: "nested_brace" },
    // raw html expressions are tokenized separately by espree
    _raw_html_expression: { match: /[^{}"']+/, lineBreaks: true },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },
  simple_expression_tag: {
    include: "nested_string",
    _left_brace: { match: /{/, push: "nested_brace" },
    // simple mustache expressions are tokenized separately by espree
    _simple_mustache_expression: { match: /[^{}"']+/, lineBreaks: true },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  },

  // used in all expressions to prevent mis-tokenization of nested closing braces as terminations of mustache tags
  // used in each expressions to prevent mis-tokenization of in-brace "as" character sequences as terminations of each expressions (and the start of each context expressions)
  // used in each context expressions to prevent mis-tokenization of in-brace commas, opening parens, or ampersats as terminations of each context expressions (and the start of each index expressions or key expressions, respectively)
  // used in await expressions to prevent mis-tokenization of in-brace "then" character sequences as terminations of await expressions (and the start of compact then expressions)
  nested_brace: {
    include: "nested_string",
    _left_brace: { match: /{/, push: "nested_brace" },
    _right_brace: { match: /}/, pop: true },
    _brace_contents: { match: /[^{}"']+/, lineBreaks: true }
  },

  // used in each expressions to prevent mis-tokenization of in-bracket "as" character sequences as terminations of each expressions (and the start of each context expressions)
  // used in each context expressions to prevent mis-tokenization of in-bracket commas, opening parens, or ampersats as terminations of each context expressions (and the start of each index expressions or key expressions, respectively)
  // used in await expressions to prevent mis-tokenization of in-bracket "then" character sequences as terminations of await expressions (and the start of compact then expressions)
  nested_bracket: {
    include: "nested_string",
    _left_bracket: { match: /\[/, push: "nested_bracket" },
    _right_bracket: { match: /]/, pop: true },
    _bracket_contents: { match: /[^[\]"']+/, lineBreaks: true }
  },

  // used in each key expressions to prevent mis-tokenization of nested closing parens as terminations of each key expressions
  nested_paren: {
    include: "nested_string",
    _left_paren: { match: /\(/, push: "nested_paren" },
    _right_paren: { match: /\)/, pop: true },
    _paren_contents: { match: /[^()"']+/, lineBreaks: true }
  },

  // used in all expressions to prevent mis-tokenization of in-string closing braces as terminiations of mustache tags
  // used in each expressions to prevent mis-tokenization of in-string "as" character sequences as terminations of each expressions (and the start of each context expressions)
  // used in each context expressions to prevent mis-tokenization of in-string commas, opening parens, or ampersats as terminations of each context expressions (and the start of each index expressions or key expressions, respectively)
  // used in each key expressions to prevent mis-tokenization of in-string closing parens as terminations of each key expressions
  // used in await expressions to prevent mis-tokenization of in-string "then" character sequences as terminations of await expressions (and the start of compact then expressions)
  // used in nested brace/bracket/paren states to prevent mis-tokenization of in-string closing braces/brackets/parens as terminations of those nested states
  nested_string: {
    // https://github.com/no-context/moo/pull/93
    _string: { match: /'(?:\\[^]|[^\\'])*?'|"(?:\\[^]|[^\\"])*?"/ }
  },
  mustache_close_end: {
    _whitespace: { match: /\s+/, lineBreaks: true },
    [TOKENS.MUSTACHE_END]: { match: /}/, pop: true }
  }
});

module.exports = { template_lexer };
