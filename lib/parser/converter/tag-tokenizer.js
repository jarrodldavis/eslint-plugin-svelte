"use strict";

const {
  template_lexer,
  TOKEN_TYPES: LEXER_TOKEN_TYPES
} = require("./template-lexer");

const {
  SKIP_AUTO_PUSH,
  ESPREE_TOKEN_TYPES,
  TOKEN_MAPPINGS,
  IDENTIFIERS
} = require("./token-mappings");

const CODE = Symbol("TagTokenizer.code");
const ESPREE_TOKENS = Symbol("TagTokenizer.espree_tokens");
const LEXER_TOKENS = Symbol("TagTokenizer.lexer_tokens");
const LEXER_TOKEN_INDICES = Symbol("TagTokenizer.lexer_token_indices");
const ITERATE_TOKENS = Symbol("TagTokenizer.iterate_tokens()");
const FIND_IDENTIFIER = Symbol("TagTokenizer.find_identifier()");
const EXPAND_IDENTIFIER = Symbol("TagTokenizer.expand_identifier()");

// eslint-disable-next-line max-lines-per-function
function TagTokenizerMixin(SuperClass) {
  return class TagTokenizer extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
      this[ESPREE_TOKENS] = options.tokens;
      this[LEXER_TOKENS] = [];
      this[LEXER_TOKEN_INDICES] = {};
    }

    *[ITERATE_TOKENS](start_position, start_type, end_type) {
      const start_array_index = this[LEXER_TOKEN_INDICES][start_position];

      if (typeof start_array_index !== "number") {
        throw new Error(
          `Could not find token for source position '${start_position}'`
        );
      }

      const tokens = this[LEXER_TOKENS];
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

    [FIND_IDENTIFIER](start, type) {
      const boundaries = IDENTIFIERS[type];

      if (!boundaries) {
        throw new Error(
          `Token type '${type}' is not an expected identifier type`
        );
      }

      const tokens = this[ITERATE_TOKENS](
        start,
        boundaries.start,
        boundaries.end
      );

      for (const token of tokens) {
        if (token.type === type) {
          return token;
        }
      }

      throw new Error(
        `Could not find a '${type}' token for tag starting at '${start}'`
      );
    }

    [EXPAND_IDENTIFIER](node, attribute, type) {
      const name = node[attribute];

      const identifier = this[FIND_IDENTIFIER](node.start, type);

      node[attribute] = {
        type: ESPREE_TOKEN_TYPES.Identifier,
        start: identifier.offset,
        end: identifier.offset + identifier.value.length,
        name: identifier.value
      };

      if (node[attribute].name !== name) {
        throw new Error(
          `Identifier mismatch: Expected '${name}', got '${
            node[attribute].name
          }'`
        );
      }

      return identifier;
    }

    TemplateRoot() {
      template_lexer.reset(this[CODE]);
      for (const lexer_token of template_lexer) {
        if (lexer_token.type.startsWith("_")) {
          continue;
        }

        const type = TOKEN_MAPPINGS[lexer_token.type];
        if (!type) {
          throw new Error(`Unexpected token type '${lexer_token.type}'`);
        }

        const lexer_tokens = this[LEXER_TOKENS];
        this[LEXER_TOKEN_INDICES][lexer_token.offset] = lexer_tokens.length;
        lexer_tokens.push(lexer_token);

        // some tokens need further normalization
        if (type === SKIP_AUTO_PUSH) {
          continue;
        }

        this[ESPREE_TOKENS].push({
          type,
          start: lexer_token.offset,
          end: lexer_token.offset + lexer_token.value.length,
          value: lexer_token.value
        });
      }
    }

    Text(node) {
      const existing_token_index = this[LEXER_TOKEN_INDICES][node.start];
      if (typeof existing_token_index === "number") {
        // Text nodes from attribute values are already tokenized by the lexer
        return;
      }

      this[ESPREE_TOKENS].push({
        type: "Text",
        start: node.start,
        end: node.end,
        value: node.data
      });
    }

    "Action, Animation, Let, Transition"(node) {
      const lexer_token = this[EXPAND_IDENTIFIER](
        node,
        "name",
        LEXER_TOKEN_TYPES.DIRECTIVE_IDENTIFIER
      );

      this[ESPREE_TOKENS].push({
        type: ESPREE_TOKEN_TYPES.Identifier,
        start: lexer_token.offset,
        end: lexer_token.offset + lexer_token.value.length,
        value: lexer_token.value
      });
    }

    "Binding, Class, EventHandler"(node) {
      const lexer_token = this[FIND_IDENTIFIER](
        node.start,
        LEXER_TOKEN_TYPES.DIRECTIVE_IDENTIFIER
      );

      lexer_token.type = ESPREE_TOKEN_TYPES.String;

      if (
        node.expression &&
        node.expression.type === "Identifier" &&
        node.expression.start === lexer_token.offset
      ) {
        /**
         * Shorthand binding (e.g. `<input bind:value />`) and class
         * (e.g. `<div class:button />`) directives will have an incorrect end
         * positions if modifiers are present (e.g. `<input bind:value|foo />`).
         *
         * While no modifiers appear to be present for binding and class nodes
         * yet, the Svelte compiler parses and accepts them and they perhaps
         * could be used in future versions.
         */
        const { offset, value } = lexer_token;
        node.expression.end = offset + value.length;
      } else {
        this[ESPREE_TOKENS].push({
          type: ESPREE_TOKEN_TYPES.String,
          start: lexer_token.offset,
          end: lexer_token.offset + lexer_token.value.length,
          value: lexer_token.value
        });
      }
    }

    EachBlock(node) {
      if (node.index) {
        this[EXPAND_IDENTIFIER](
          node,
          "index",
          LEXER_TOKEN_TYPES.EACH_INDEX_IDENTIFIER
        );
      }

      if (node.key && !node.key.type) {
        this[EXPAND_IDENTIFIER](
          node,
          "key",
          LEXER_TOKEN_TYPES.EACH_KEY_IDENTIFIER
        );
      }
    }

    AwaitBlock(node) {
      if (node.pending.start === null) {
        delete node.pending;
      }

      if (node.pending) {
        // full await block
        node.then.value = node.value;
        delete node.value;
        this[EXPAND_IDENTIFIER](
          node.then,
          "value",
          LEXER_TOKEN_TYPES.AWAIT_THEN_IDENTIFIER
        );
      } else {
        // compact await block
        this[EXPAND_IDENTIFIER](
          node,
          "value",
          LEXER_TOKEN_TYPES.AWAIT_THEN_IDENTIFIER
        );
      }

      if (!node.error) {
        delete node.catch;
        return;
      }

      node.catch.error = node.error;
      delete node.error;
      this[EXPAND_IDENTIFIER](
        node.catch,
        "error",
        LEXER_TOKEN_TYPES.AWAIT_CATCH_IDENTIFIER
      );
    }
  };
}

module.exports = { TagTokenizerMixin };
