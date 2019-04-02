// eslint-disable-next-line max-classes-per-file
"use strict";

import { getLineInfo } from "acorn";

const POSITION_APPLIED = Symbol("eslint-plugin-svelte error position marker");

class LexerTokenSyntaxError extends SyntaxError {
  constructor(lexer_token, message) {
    super(message);
    this.lineNumber = lexer_token.line;
    this.column = lexer_token.col;
    this.index = lexer_token.offset;
    this[POSITION_APPLIED] = true;
  }
}

function apply_node_position(error, node, code) {
  error[POSITION_APPLIED] = true;

  error.index = node.start;

  if (node.loc && node.loc.start) {
    error.lineNumber = node.loc.start.line;
    // ESLint expects errors to have 1-based columns
    error.column = node.loc.start.column + 1;
    return;
  }

  if (!code) {
    return;
  }

  const { line, column } = getLineInfo(code, node.start);
  error.lineNumber = line;
  // ESLint expects errors to have 1-based columns
  error.column = column + 1;
}

class NodeSyntaxError extends SyntaxError {
  constructor(node, message, code = null) {
    super(message);
    apply_node_position(this, node, code);
  }
}

export {
  POSITION_APPLIED,
  LexerTokenSyntaxError,
  apply_node_position,
  NodeSyntaxError
};
