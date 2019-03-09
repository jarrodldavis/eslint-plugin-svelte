const HTML_TAG_LOCATION = {
  start_offset: 0,
  start_value: "<",
  end_offset: 0,
  end_value: ">"
};

const DEFAULT_MUSTACHE_LOCATION = {
  start_offset: 0,
  start_value: "{",
  end_offset: 0,
  end_value: "}"
};

const TAG_LOCATIONS = {
  Head: HTML_TAG_LOCATION,
  Title: HTML_TAG_LOCATION,
  Options: HTML_TAG_LOCATION,
  Window: HTML_TAG_LOCATION,
  Body: HTML_TAG_LOCATION,
  InlineComponent: HTML_TAG_LOCATION,
  Element: HTML_TAG_LOCATION,

  IfBlock: DEFAULT_MUSTACHE_LOCATION,
  AwaitBlock: DEFAULT_MUSTACHE_LOCATION,
  EachBlock: DEFAULT_MUSTACHE_LOCATION,
  MustacheTag: DEFAULT_MUSTACHE_LOCATION,
  RawMustacheTag: DEFAULT_MUSTACHE_LOCATION,
  DebugTag: DEFAULT_MUSTACHE_LOCATION,

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

function create_range_error_message(start, end, expected, actual) {
  return `Invalid tag token range (${start}, ${end}): Expected '${expected}', got '${actual}`;
}

function create_tag_tokens(node, code) {
  if (!TAG_LOCATIONS.hasOwnProperty(node.type)) {
    return [];
  }

  const { start_offset, start_value, end_offset, end_value } = TAG_LOCATIONS[
    node.type
  ];

  const start_start = node.start + start_offset;
  const start_end = node.start + start_offset + 1;
  const end_start = node.end + end_offset - 1;
  const end_end = node.end + end_offset;

  const actual_start_value = code.slice(start_start, start_end);
  if (actual_start_value !== start_value) {
    throw new Error(
      create_range_error_message(
        start_start,
        start_end,
        start_value,
        actual_start_value
      )
    );
  }

  const actual_end_value = code.slice(end_start, end_end);
  if (actual_end_value !== end_value) {
    throw new Error(
      create_range_error_message(
        end_start,
        end_end,
        end_value,
        actual_end_value
      )
    );
  }

  return [
    {
      type: "Punctuator",
      start: start_start,
      end: start_end,
      value: start_value
    },
    {
      type: "Punctuator",
      start: end_start,
      end: end_end,
      value: end_value
    }
  ];
}

function create_text_tokens(node) {
  if (node.type === "Text") {
    return [
      {
        type: "Text",
        start: node.start,
        end: node.end,
        value: node.data
      }
    ];
  } else if (node.type === "Attribute") {
    return [
      {
        type: "Text",
        start: node.start,
        end: node.start + node.name.length,
        value: node.name
      }
    ];
  }

  return [];
}

module.exports = { create_tag_tokens, create_text_tokens };
