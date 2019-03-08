const TAG_NODE_TYPES = [
  "Head",
  "Title",
  "Options",
  "Window",
  "Body",
  "InlineComponent",
  "Element"
];

const MUSTACHE_NODE_TYPES = {
  IfBlock: { start_offset: 0, start_value: "{", end_offset: 0, end_value: "}" },
  AwaitBlock: {
    start_offset: 0,
    start_value: "{",
    end_offset: 0,
    end_value: "}"
  },
  EachBlock: {
    start_offset: 0,
    start_value: "{",
    end_offset: 0,
    end_value: "}"
  },
  MustacheTag: {
    start_offset: 0,
    start_value: "{",
    end_offset: 0,
    end_value: "}"
  },
  RawMustacheTag: {
    start_offset: 0,
    start_value: "{",
    end_offset: 0,
    end_value: "}"
  },
  DebugTag: {
    start_offset: 0,
    start_value: "{",
    end_offset: 0,
    end_value: "}"
  },
  ElseBlock: {
    start_offset: -1,
    start_value: "}",
    end_offset: 1,
    end_value: "{"
  },
  PendingBlock: {
    start_offset: -1,
    start_value: "}",
    end_offset: 1,
    end_value: "{"
  },
  ThenBlock: {
    start_offset: 0,
    start_value: "{",
    end_offset: 1,
    end_value: "{"
  },
  CatchBlock: {
    start_offset: 0,
    start_value: "{",
    end_offset: 1,
    end_value: "{"
  }
};

function add_mustache_tokens(node, code) {
  let tokens = [];

  if (MUSTACHE_NODE_TYPES.hasOwnProperty(node.type)) {
    const {
      start_offset,
      start_value,
      end_offset,
      end_value
    } = MUSTACHE_NODE_TYPES[node.type];

    const start_start = node.start + start_offset;
    const start_end = node.start + start_offset + 1;
    const end_start = node.end + end_offset - 1;
    const end_end = node.end + end_offset;

    const actual_start_value = code.slice(start_start, start_end);
    if (actual_start_value !== start_value) {
      throw new Error(
        `Invalid mustache tag token range (${start_start}, ${start_end}): Expected '${start_value}', got '${actual_start_value}`
      );
    }

    const actual_end_value = code.slice(end_start, end_end);
    if (actual_end_value !== end_value) {
      throw new Error(
        `Invalid mustache tag token range (${end_start}, ${end_end}): Expected '${end_value}', got '${end_start_value}`
      );
    }

    tokens = [
      {
        type: "Punctuator",
        start: start_start,
        end: start_end,
        value: start_value
      },
      { type: "Punctuator", start: end_start, end: end_end, value: end_value }
    ];
  }

  return tokens;
}

function add_tag_tokens(node) {
  let tokens = [];

  if (TAG_NODE_TYPES.indexOf(node.type) > -1) {
    tokens = [
      {
        type: "Punctuator",
        start: node.start,
        end: node.start + 1,
        value: "<"
      },
      {
        type: "Punctuator",
        start: node.end - 1,
        end: node.end,
        value: ">"
      }
    ];
  } else if (node.type === "Text") {
    tokens = [
      {
        type: "Text",
        start: node.start,
        end: node.end,
        value: node.data
      }
    ];
  } else if (node.type === "Attribute") {
    tokens = [
      {
        type: "Text",
        start: node.start,
        end: node.start + node.name.length,
        value: node.name
      }
    ];
  }

  return tokens;
}

module.exports = { add_tag_tokens, add_mustache_tokens };
