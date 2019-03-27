"use strict";
const base_keys = require("eslint-visitor-keys");

const EXPRESSION_KEY = "expression";
const CHILDREN_KEY = "children";
const ELEMENT_KEYS = [CHILDREN_KEY, "attributes"];

const ADDITIONAL_KEYS = {
  TemplateRoot: ["html", "css", "instance", "module"],

  // fragment: root
  Fragment: [CHILDREN_KEY],

  // tag: comment
  Comment: [],

  // tag: meta tags (<svelte:...>)
  Head: ELEMENT_KEYS,
  Options: ELEMENT_KEYS,
  Window: ELEMENT_KEYS,
  Body: ELEMENT_KEYS,

  // tag: component references, including <svelte:component /> and <svelte:self />
  InlineComponent: [...ELEMENT_KEYS, EXPRESSION_KEY, "identifier"],

  // tag: title, inside <svelte:head>
  Title: ELEMENT_KEYS,

  // tag: normal block tags
  Slot: ELEMENT_KEYS,
  Element: ELEMENT_KEYS,

  // tag: attributes
  Attribute: ["value"],
  AttributeShorthand: [EXPRESSION_KEY],
  Spread: [EXPRESSION_KEY],

  // tag: directives
  Action: [EXPRESSION_KEY],
  Animation: [EXPRESSION_KEY],
  Binding: [EXPRESSION_KEY],
  Class: [EXPRESSION_KEY],
  EventHandler: [EXPRESSION_KEY],
  Let: [EXPRESSION_KEY],
  Ref: [EXPRESSION_KEY],
  Transition: [EXPRESSION_KEY],

  // mustache: await block
  AwaitBlock: [EXPRESSION_KEY, "value", "pending", "then", "catch"],
  PendingBlock: [CHILDREN_KEY],
  ThenBlock: [CHILDREN_KEY, "value"],
  CatchBlock: [CHILDREN_KEY, "error"],

  // mustache: each block
  EachBlock: [EXPRESSION_KEY, "context", "index", "key", "children", "else"],

  // mustache: if
  IfBlock: [EXPRESSION_KEY, CHILDREN_KEY, "else"],

  // mustache: if -> else, elseif; each -> else
  ElseBlock: [CHILDREN_KEY],

  // mustache: @blocks
  RawMustacheTag: [EXPRESSION_KEY],
  DebugTag: ["identifiers"],

  // fragment, tag, mustache: simple text/mustache sequences
  Text: [],
  MustacheTag: [EXPRESSION_KEY]
};

const EXPRESSION_NODES = Object.entries(ADDITIONAL_KEYS)
  .filter(([_type, keys]) => keys.indexOf(EXPRESSION_KEY) > -1)
  .map(([type]) => type);

const KEYS = base_keys.unionWith(ADDITIONAL_KEYS);

module.exports = { KEYS, EXPRESSION_NODES };
