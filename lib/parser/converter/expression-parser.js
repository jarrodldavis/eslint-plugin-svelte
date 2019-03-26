"use strict";

const { tokTypes, Token } = require("acorn");

const { get_parser } = require("./espree");
const { EXPRESSION_NODES } = require("../keys");

const CODE = Symbol("ExpressionParser.code");
const PARSER_OPTIONS = Symbol("ExpressionParser.parser_options");
const TOKENS = Symbol("ExpressionParser.tokens");
const COMMENTS = Symbol("ExpressionParser.comments");
const PARSE_EXPRESSION = Symbol("ExpressionParser.parse_expression()");

const IMPORTED_COMPONENT_REFERENCE = "InlineComponent[name=/^[A-Z]/]";
const EXPRESSION_NODE_ENTER = EXPRESSION_NODES.map(
  type => `${type} > .expression`
).join(", ");

// eslint-disable-next-line max-params
function parseExpressionAt(code, base_options, start, end, assignable) {
  const Parser = get_parser(start);
  const parser = new Parser(base_options, code.slice(0, end));

  parser.nextToken();

  const destructuring_errors = {
    shorthandAssign: -1,
    trailingComma: -1,
    parenthesizedAssign: -1,
    parenthesizedBind: -1,
    doubleProto: -1
  };

  let expression = parser.parseExpression(undefined, destructuring_errors);
  if (assignable) {
    expression = parser.toAssignable(expression, false, destructuring_errors);
    parser.checkLVal(expression);
  }

  // espree holds closing curly braces hostage until the next token
  parser.finishToken(tokTypes.eof);
  parser.options.onToken(new Token(parser));

  const { tokens, comments } = parser.get_extras();
  return { expression, tokens, comments };
}

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
        throw new Error(
          `Parse result mismatch for template expression: expected '${
            node.type
          }', got '${expression.type}'`
        );
      }

      this[TOKENS].push(...tokens);
      this[COMMENTS].push(...comments);

      return expression;
    }

    [IMPORTED_COMPONENT_REFERENCE](node) {
      node.identifier = {
        type: "Identifier",
        name: node.name,
        start: node.start + 1,
        end: node.start + 1 + node.name.length
      };
    }

    [`${IMPORTED_COMPONENT_REFERENCE} > .identifier`](node) {
      return this[PARSE_EXPRESSION](node);
    }

    [EXPRESSION_NODE_ENTER](node) {
      return this[PARSE_EXPRESSION](node);
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
