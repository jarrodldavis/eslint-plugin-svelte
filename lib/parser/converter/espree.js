"use strict";

const acorn = require("acorn");
const espree = require("espree/lib/espree");

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

module.exports = { get_parser };
