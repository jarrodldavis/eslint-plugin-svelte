"use strict";

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

module.exports = { TAG_LOCATIONS };
