"use strict";

const { IDENTIFIERS } = require("./token-mappings");

const ITERATE_TOKENS = Symbol("TokenCollection.iterate_tokens()");
const TOKENS = Symbol("TokenCollection.tokens");
const TOKEN_INDICES = Symbol("TokenCollection.token_indices");

class LexerTokenCollection {
  constructor() {
    this[TOKENS] = [];
    this[TOKEN_INDICES] = {};
  }

  *[ITERATE_TOKENS](start_position, start_type, end_type) {
    const start_array_index = this[TOKEN_INDICES][start_position];

    if (typeof start_array_index !== "number") {
      throw new Error(
        `Could not find token for source position '${start_position}'`
      );
    }

    const tokens = this[TOKENS];
    const start_token = tokens[start_array_index];

    if (!start_token) {
      throw new Error(
        `Could not find token for source position '${start_position}'`
      );
    }

    if (start_token.type !== start_type) {
      throw new Error(
        `Unexpected token '${
          start_token.type
        } for source position '${start_position}'`
      );
    }

    for (let index = start_array_index; index < tokens.length; index += 1) {
      const token = tokens[index];

      yield token;

      if (token.type === end_type) {
        break;
      }
    }
  }

  add(lexer_token) {
    const lexer_tokens = this[TOKENS];
    this[TOKEN_INDICES][lexer_token.offset] = lexer_tokens.length;
    lexer_tokens.push(lexer_token);
  }

  find_identifier(start_position, type) {
    const boundaries = IDENTIFIERS[type];

    if (!boundaries) {
      throw new Error(
        `Token type '${type}' is not an expected identifier type`
      );
    }

    const tokens = this[ITERATE_TOKENS](
      start_position,
      boundaries.start,
      boundaries.end
    );

    for (const token of tokens) {
      if (token.type === type) {
        return token;
      }
    }

    throw new Error(
      `Could not find a '${type}' token for tag starting at ${start_position}`
    );
  }

  get_token(start_position) {
    const array_index = this[TOKEN_INDICES][start_position];

    if (typeof array_index !== "number") {
      return undefined;
    }

    return this[TOKENS][array_index];
  }
}

module.exports = { LexerTokenCollection };
