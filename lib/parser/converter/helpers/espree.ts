"use strict";

import acorn from "acorn";
import espree from "espree/lib/espree";

function svelte(position) {
  return function extend(Parser) {
    return class SvelteEspreeParser extends Parser {
      constructor(options, code) {
        // work around espree not allowing start position argument
        super(options, code, position);
      }

      get_extras() {
        const state_symbol = Object.getOwnPropertySymbols(this).find(
          symbol =>
            symbol.description === "espree's internal state" ||
            symbol.toString() === "Symbol(espree's internal state)"
        );

        if (!state_symbol) {
          throw new Error("Could not find espree state");
        }

        const { tokens, comments } = this[state_symbol];

        return { tokens, comments };
      }
    };
  };
}

function get_parser(position) {
  return acorn.Parser.extend(svelte(position), espree());
}

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
  parser.finishToken(acorn.tokTypes.eof);
  parser.options.onToken(new acorn.Token(parser));

  const { tokens, comments } = parser.get_extras();
  return { expression, tokens, comments };
}

export { get_parser, parseExpressionAt };
