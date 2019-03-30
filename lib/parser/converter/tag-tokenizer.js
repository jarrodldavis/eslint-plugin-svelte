"use strict";

const { template_lexer } = require("./helpers/template-lexer");

const {
  SKIP_AUTO_PUSH,
  LEXER_TOKEN_TYPES,
  ESPREE_TOKEN_TYPES,
  TOKEN_MAPPINGS
} = require("./helpers/token-mappings");

const { LexerTokenCollection } = require("./helpers/lexer-token-collection");

const IMPORTED_COMPONENT_REFERENCE = "InlineComponent[name=/^[A-Z]/]";

const CODE = Symbol("TagTokenizer.code");
const ESPREE_TOKENS = Symbol("TagTokenizer.espree_tokens");
const LEXER_TOKENS = Symbol("TagTokenizer.lexer_tokens");
const EXPAND_IDENTIFIER = Symbol("TagTokenizer.expand_identifier()");

// eslint-disable-next-line max-lines-per-function
function TagTokenizerMixin(SuperClass) {
  return class TagTokenizer extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
      this[ESPREE_TOKENS] = options.tokens;
      this[LEXER_TOKENS] = new LexerTokenCollection();
    }

    [EXPAND_IDENTIFIER](node, attribute, type) {
      const name = node[attribute];

      const identifier = this[LEXER_TOKENS].find_identifier(node.start, type);

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

        this[LEXER_TOKENS].add(lexer_token);

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
      const existing_token = this[LEXER_TOKENS].get_token(node.start);
      if (existing_token) {
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

    [IMPORTED_COMPONENT_REFERENCE](node) {
      this[EXPAND_IDENTIFIER](
        node,
        "name",
        LEXER_TOKEN_TYPES.COMPONENT_IDENTIFIER
      );
    }

    "Action, Animation, Let, Transition"(node) {
      if (node.type === "Let" && node.expression) {
        /**
         * The declaration identifiers for a let directive with an expression
         * (e.g. `<Foo let:item="{{ id }}")`) will be in the expression only;
         * `name` won't be an identifier that is available to the template.
         */
        return;
      }

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
      const lexer_token = this[LEXER_TOKENS].find_identifier(
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
