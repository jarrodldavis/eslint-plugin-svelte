"use strict";

const { TAG_LOCATIONS } = require("./tag-locations");
const TAG_NODE_ENTER = Object.keys(TAG_LOCATIONS).join(", ");

const CODE = Symbol("TagTokenizer.code");
const TOKENS = Symbol("TagTokenizer.tokens");
const ADD_TOKEN = Symbol("TagTokenizer.add_token()");

// eslint-disable-next-line max-lines-per-function
function TagTokenizerMixin(SuperClass) {
  return class TagTokenizer extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
      this[TOKENS] = options.tokens;
    }

    [ADD_TOKEN](index, offset, value) {
      const start = index + offset;
      const end = index + 1 + offset;

      const actual_value = this[CODE].slice(start, end);
      if (actual_value !== value) {
        throw new Error(
          `Invalid tag token range (${start}, ${end}}): Expected '${value}', got '${actual_value}'`
        );
      }

      this[TOKENS].push({ type: "Punctuator", start, end, value });
    }

    Text(node) {
      this[TOKENS].push({
        type: "Text",
        start: node.start,
        end: node.end,
        value: node.data
      });
    }

    Attribute(node) {
      this[TOKENS].push({
        type: "Text",
        start: node.start,
        end: node.start + node.name.length,
        value: node.name
      });
    }

    [TAG_NODE_ENTER](node) {
      const {
        start_offset,
        start_value,
        end_offset,
        end_value
      } = TAG_LOCATIONS[node.type];
      this[ADD_TOKEN](node.start, start_offset, start_value);
      this[ADD_TOKEN](node.end - 1, end_offset, end_value);
    }
  };
}

module.exports = { TagTokenizerMixin };
