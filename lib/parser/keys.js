"use strict";
const base_javascript_keys = require("eslint-visitor-keys");

const EXPRESSION_KEY = "expression";
const CHILDREN_KEY = "children";
const ELEMENT_KEYS = [CHILDREN_KEY, "attributes"];

const BASE_TEMPLATE_KEYS = {
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
  AwaitBlock: [EXPRESSION_KEY, "pending", "then", "catch"],
  PendingBlock: [CHILDREN_KEY],
  ThenBlock: [CHILDREN_KEY],
  CatchBlock: [CHILDREN_KEY],

  // mustache: each block
  EachBlock: [EXPRESSION_KEY, "key", "children", "else"],

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

const EXPRESSION_NODES = Object.entries(BASE_TEMPLATE_KEYS)
  .filter(([_type, keys]) => keys.indexOf(EXPRESSION_KEY) > -1)
  .map(([type]) => type);

const BASE_SVELTE_KEYS = base_javascript_keys.unionWith(BASE_TEMPLATE_KEYS);

/**
 * `VariableDeclaration` nodes are handled differently by `eslint-scope` than by
 * other ESLint-related traversers: children of such declarations are not
 * automatically recursively visited since doing so would cause duplicate
 * references (the `eslint-scope` referencer creates initialization references
 * for child `Identifier` nodes when visiting `VariableDeclaration` nodes).
 *
 * The following additional keys are for in-template declaration identifier
 * nodes that are functionally similar to `VariableDeclaration` nodes and as
 * such should be ignored by the extended `eslint-scope` referencer
 * (`SvelteReferencer`).
 */
const ALL_TEMPLATE_KEYS = {
  ...BASE_TEMPLATE_KEYS,
  AwaitBlock: [...BASE_TEMPLATE_KEYS.AwaitBlock, "value"],
  ThenBlock: [...BASE_TEMPLATE_KEYS.ThenBlock, "value"],
  CatchBlock: [...BASE_TEMPLATE_KEYS.CatchBlock, "error"],
  EachBlock: [...BASE_TEMPLATE_KEYS.EachBlock, "context", "index"]
};

const ALL_SVELTE_KEYS = base_javascript_keys.unionWith(ALL_TEMPLATE_KEYS);

module.exports = { BASE_SVELTE_KEYS, ALL_SVELTE_KEYS, EXPRESSION_NODES };
