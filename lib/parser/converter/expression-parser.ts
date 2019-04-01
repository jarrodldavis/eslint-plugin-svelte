"use strict";

const { NodeSyntaxError } = require("../errors");

const { parseExpressionAt } = require("./helpers/espree");
const { EXPRESSION_NODES } = require("../keys");

const CODE = Symbol("ExpressionParser.code");
const PARSER_OPTIONS = Symbol("ExpressionParser.parser_options");
const TOKENS = Symbol("ExpressionParser.tokens");
const COMMENTS = Symbol("ExpressionParser.comments");
const PARSE_EXPRESSION = Symbol("ExpressionParser.parse_expression()");

const EXPRESSION_NODE_ENTER = EXPRESSION_NODES.filter(type => type !== "Let")
  .map(type => `${type} > .expression`)
  .join(", ");

// eslint-disable-next-line max-lines-per-function
function ExpressionParserMixin(SuperClass) {
  return class ExpressionParser extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
      this[PARSER_OPTIONS] = options.parser_options;
      this[TOKENS] = options.tokens;
      this[COMMENTS] = options.comments;
    }

    [PARSE_EXPRESSION](node, assignable = false) {
      const { expression, tokens, comments } = parseExpressionAt(
        this[CODE],
        this[PARSER_OPTIONS],
        node.start,
        node.end,
        assignable
      );

      if (expression.type !== node.type) {
        throw new NodeSyntaxError(
          node,
          `Parse result mismatch for template expression: expected '${
            node.type
          }', got '${expression.type}'`,
          this[CODE]
        );
      }

      this[TOKENS].push(...tokens);
      this[COMMENTS].push(...comments);

      return expression;
    }

    [EXPRESSION_NODE_ENTER](node) {
      return this[PARSE_EXPRESSION](node);
    }

    "Let > .expression"(node) {
      /**
       * The Svelte compiler currently parses let directive expressions like it
       * does for other directives (using `acorn`), resulting in non-assignable
       * node types. This is in contrast to each block context expressions,
       * which it parses manually and sets assignable node types.
       *
       * Since let directive expressions define declaration identifiers, such
       * nodes should be assignable types.
       */
      switch (node.type) {
        case "ObjectExpression":
          node.type = "ObjectPattern";
          break;
        case "ArrayExpression":
          node.type = "ArrayPattern";
          break;
        case "Identfier":
        case "ObjectPattern":
        case "ArrayPattern":
          break;
        default:
          throw new NodeSyntaxError(
            node,
            `Unexpected let directive expression type '${node.type}'`,
            this[CODE]
          );
      }

      return this[PARSE_EXPRESSION](node, true);
    }

    "EachBlock > .context"(node) {
      return this[PARSE_EXPRESSION](node, true);
    }

    "EachBlock > .key"(node) {
      return this[PARSE_EXPRESSION](node);
    }
  };
}

module.exports = { ExpressionParserMixin };
