"use strict";

const { VisitorOption } = require("estraverse");

const { template_lexer } = require("./helpers/template-lexer");

const {
  LEXER_TOKEN_TYPES,
  ESPREE_TOKEN_TYPES,
  TOKEN_MAPPINGS
} = require("./helpers/token-mappings");

const IMPORTED_COMPONENT_REFERENCE = "InlineComponent[name=/^[A-Z]/]";

const CODE = Symbol("TagTokenizer.code");
const ESPREE_TOKENS = Symbol("TagTokenizer.espree_tokens");
const IDENTIFIER_TOKENS = Symbol("TagTokenizer.identifier_tokens");
const GET_IDENTIFIER = Symbol("TagTokenizer.get_identifier()");
const EXPAND_IDENTIFIER = Symbol("TagTokenizer.expand_identifier()");

// eslint-disable-next-line max-lines-per-function
function TagTokenizerMixin(SuperClass) {
  return class TagTokenizer extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
      this[ESPREE_TOKENS] = options.tokens;
      this[IDENTIFIER_TOKENS] = [];
    }

    [GET_IDENTIFIER](type, name) {
      const identifier = this[IDENTIFIER_TOKENS].shift();

      if (!identifier) {
        throw new Error("Could not get identifier token");
      }

      if (identifier.type !== type) {
        throw new Error(
          `Identifier type mismatch: Expected '${type}', got '${
            identifier.type
          }'`
        );
      }

      if (identifier.value !== name) {
        throw new Error(
          `Identifier name mismatch: Expected '${name}', got '${
            identifier.value
          }'`
        );
      }

      return identifier;
    }

    [EXPAND_IDENTIFIER](node, attribute, type) {
      const name = node[attribute];

      const identifier = this[GET_IDENTIFIER](type, name);

      node[attribute] = {
        type: ESPREE_TOKEN_TYPES.Identifier,
        start: identifier.offset,
        end: identifier.offset + identifier.value.length,
        name: identifier.value
      };

      this[ESPREE_TOKENS].push({
        type: ESPREE_TOKEN_TYPES.Identifier,
        start: identifier.offset,
        end: identifier.offset + identifier.value.length,
        value: identifier.value
      });
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

        if (type === ESPREE_TOKEN_TYPES.Identifier) {
          this[IDENTIFIER_TOKENS].push(lexer_token);
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

    "Attribute > Text"() {
      return VisitorOption.Remove;
    }

    Text(node) {
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
      /**
       * The declaration identifiers for a let directive with an expression
       * (e.g. `<Foo let:item="{{ id }}")`) will be in the expression only;
       * `name` won't be an identifier that is available to the template.
       */
      if (node.type === "Let" && node.expression) {
        // update token array so that identifier token is discarded
        this[GET_IDENTIFIER](LEXER_TOKEN_TYPES.DIRECTIVE_IDENTIFIER, node.name);
        return;
      }

      this[EXPAND_IDENTIFIER](
        node,
        "name",
        LEXER_TOKEN_TYPES.DIRECTIVE_IDENTIFIER
      );
    }

    "Binding, Class, EventHandler"(node) {
      const lexer_token = this[GET_IDENTIFIER](
        LEXER_TOKEN_TYPES.DIRECTIVE_IDENTIFIER,
        node.name
      );

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
