"use strict";

const {
  template_lexer,
  TOKEN_TYPES: LEXER_TOKEN_TYPES
} = require("./template-lexer");

const CODE = Symbol("TagTokenizer.code");
const ESPREE_TOKENS = Symbol("TagTokenizer.espree_tokens");
const LEXER_TOKENS = Symbol("TagTokenizer.lexer_tokens");
const LEXER_TOKEN_INDICES = Symbol("TagTokenizer.lexer_token_indices");
const FIND_IDENTIFIER = Symbol("TagTokenizer.find_identifier()");
const EXPAND_IDENTIFIER = Symbol("TagTokenizer.expand_identifier()");

const ESPREE_TOKEN_TYPES = {
  Identifier: "Identifier",
  Keyword: "Keyword",
  Punctuator: "Punctuator",
  String: "String"
};

const TOKEN_MAPPINGS = {
  [LEXER_TOKEN_TYPES.HTML_OPEN_START]: ESPREE_TOKEN_TYPES.Punctuator,
  [LEXER_TOKEN_TYPES.ATTRIBUTE_NAME]: ESPREE_TOKEN_TYPES.String,
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

    [FIND_IDENTIFIER](start, type) {
      const start_array_index = this[LEXER_TOKEN_INDICES][start];

      const tokens = this[LEXER_TOKENS];
      const mustache_start = tokens[start_array_index];

      if (typeof start_array_index !== "number" || !mustache_start) {
        throw new Error(`Could not find token for source position '${start}'`);
      }

      if (mustache_start.type !== LEXER_TOKEN_TYPES.MUSTACHE_START) {
        throw new Error(
          `Unexpected token '${
            mustache_start.type
          } for source position '${start}'`
        );
      }

      for (let index = start_array_index; index < tokens.length; index += 1) {
        const token = tokens[index];

        if (token.type === type) {
          return token;
        }

        if (token.type === LEXER_TOKEN_TYPES.MUSTACHE_END) {
          break;
        }
      }

      throw new Error(
        `Could not find a '${type}' token for mustache tag starting at '${start}'`
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
    }

    TemplateRoot() {
      template_lexer.reset(this[CODE]);
      for (const lexer_token of template_lexer) {
        if (lexer_token.type.startsWith("_")) {
          continue;
        }

        const type = TOKEN_MAPPINGS[lexer_token.type];
        if (!type) {
          throw new Error(`Unexpected token type '${type}'`);
        }

        const lexer_tokens = this[LEXER_TOKENS];
        this[LEXER_TOKEN_INDICES][lexer_token.offset] = lexer_tokens.length;
        lexer_tokens.push(lexer_token);

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
