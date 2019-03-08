const evk = require("eslint-visitor-keys");

const ELEMENT_KEYS = ["children", "attributes"];
const EXPRESSION_KEY = ["expression"];

const KEYS = evk.unionWith({
  // fragment: root
  Fragment: ["children"],

  // tag: comment
  Comment: [],

  // tag: meta tags (<svelte:...>)
  Head: ELEMENT_KEYS,
  Options: ELEMENT_KEYS,
  Window: ELEMENT_KEYS,
  Body: ELEMENT_KEYS,

  // tag: component references, including <svelte:component /> and <svelte:self />
  InlineComponent: [...ELEMENT_KEYS, ...EXPRESSION_KEY, "identifier"],

  // tag: title, inside <svelte:head>
  Title: ELEMENT_KEYS,

  // tag: normal block tags
  Slot: ELEMENT_KEYS,
  Element: ELEMENT_KEYS,

  // tag: attributes
  Attribute: ["value"],
  AttributeShorthand: EXPRESSION_KEY,
  Spread: EXPRESSION_KEY,

  // tag: directives
  Action: EXPRESSION_KEY,
  Animation: EXPRESSION_KEY,
  Binding: EXPRESSION_KEY,
  Class: EXPRESSION_KEY,
  EventHandler: EXPRESSION_KEY,
  Let: EXPRESSION_KEY,
  Ref: EXPRESSION_KEY,
  Transition: EXPRESSION_KEY,

  // mustache: await block
  AwaitBlock: ["expression", "value", "error", "pending", "then", "catch"],
  PendingBlock: ["children"],
  ThenBlock: ["children"],
  CatchBlock: ["children"],

  // mustache: each block
  EachBlock: ["expression", "context", "index", "key", "children"],

  // mustache: if
  IfBlock: ["expression", "children", "else"],

  // mustache: if -> else, elseif; each -> else
  ElseBlock: ["children"],

  // mustache: @blocks
  RawMustacheTag: EXPRESSION_KEY,
  DebugTag: ["identifiers"],

  // fragment, tag, mustache: simple text/mustache sequences
  Text: [],
  MustacheTag: EXPRESSION_KEY
});

function contains_expression_key([_node_type, visitor_keys]) {
  return visitor_keys.indexOf("expression") > -1;
}

const EXPRESSION_NODES = Object.entries(KEYS)
  .filter(contains_expression_key)
  .map(([node_type]) => node_type);

module.exports = { KEYS, EXPRESSION_NODES };
