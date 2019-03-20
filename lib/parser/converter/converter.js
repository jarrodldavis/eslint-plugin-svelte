"use strict";

const { parse } = require("espree");
const { getLineInfo } = require("acorn");
const { VisitorOption } = require("estraverse");

const { EXPRESSION_NODES } = require("../keys");
const { TAG_LOCATIONS } = require("./tag-locations");
const { BaseVisitor } = require("./base-visitor");

const EXPRESSION_NODE_ENTER = EXPRESSION_NODES.map(
  type => `${type} > .expression`
).join(", ");
const EXPRESSION_NODE_LEAVE = `${EXPRESSION_NODE_ENTER}:leave`;
const TAG_NODE_ENTER = Object.keys(TAG_LOCATIONS).join(", ");
const IMPORTED_COMPONENT_REFERENCE = "InlineComponent[name=/^[A-Z]/]";

const OFFSET_INACTIVE = -1;
const TRAVERSAL_MARKER = Symbol("eslint-plugin-svelte traversal marker");

function by_range(positionable1, positionable2) {
  return positionable1.range[0] - positionable2.range[0];
}

class Converter extends BaseVisitor {
  constructor(code, options) {
    super();
    this.code = code;
    this.options = options;
    this.offset_amount = OFFSET_INACTIVE;
    this.offset_parent = null;
    this.tokens = [];
    this.comments = [];
  }

  _get_line_column(start, end) {
    return {
      start: getLineInfo(this.code, start),
      end: getLineInfo(this.code, end)
    };
  }

  _set_location(node) {
    if (Array.isArray(node.range)) {
      throw new Error("Node already has range location information");
    }

    node.range = [node.start, node.end];
    node.loc = this._get_line_column(node.start, node.end);
  }

  _offset_location(node) {
    if (!Array.isArray(node.range)) {
      throw new Error("Node requires range location information");
    }

    node.start += this.offset_amount;
    node.end += this.offset_amount;
    node.range = node.range.map(index => index + this.offset_amount);
    node.loc = this._get_line_column(node.start, node.end);
  }

  _update_location(node) {
    if (!Number.isInteger(node.start) || !Number.isInteger(node.end)) {
      throw new Error("Node requires start and end location information");
    }

    if (this.offset_amount === OFFSET_INACTIVE) {
      this._set_location(node);
    } else {
      this._offset_location(node);
    }

    return node;
  }

  _add_tag_token(index, offset, value) {
    const start = index + offset;
    const end = index + 1 + offset;

    const actual_value = this.code.slice(start, end);
    if (actual_value !== value) {
      throw new Error(
        `Invalid tag token range (${start}, ${end}}): Expected '${value}', got '${actual_value}'`
      );
    }

    this.tokens.push(
      this._update_location({ type: "Punctuator", start, end, value })
    );
  }

  _enter_offset_parent(node) {
    this.offset_amount = node.start;
    this.offset_parent = node;
  }

  _leave_offset_parent() {
    this.offset_amount = OFFSET_INACTIVE;
    this.offset_parent = null;
  }

  _parse_js_slice(node) {
    const { start, end } = node;
    const slice = this.code.slice(start, end);
    const program = parse(slice, this.options);

    const offset = this._update_location.bind(this);
    this.tokens.push(...program.tokens.map(offset));
    this.comments.push(...program.comments.map(offset));

    return program;
  }

  _parse_template_expression(node) {
    const {
      body: [statement]
    } = this._parse_js_slice(node);

    if (!statement) {
      throw new Error("Failed to parse template expression");
    }

    if (statement.type !== "ExpressionStatement") {
      throw new Error(
        "Unexpected non-expression parse result for template expression"
      );
    }

    if (statement.expression.type !== node.type) {
      throw new Error(
        `Parse result mismatch for template expression: expected '${
          node.type
        }', got '${statement.expression.type}'`
      );
    }

    return statement.expression;
  }

  _update_html_body(html, js_instance, js_module) {
    if (js_instance) {
      html.body.push(...js_instance.content.body);
    }
    if (js_module) {
      html.body.push(...js_module.content.body);
    }

    html.body.sort(by_range);
  }

  _update_html_tokens(html) {
    html.tokens = this.tokens;
    html.tokens.sort(by_range);

    html.comments = this.comments;
    html.comments.sort(by_range);
  }

  _update_html_location(html) {
    const first_child = html.tokens[0] || { start: 0 };
    html.start = first_child.start;

    const last_child = html.tokens[html.tokens.length - 1] || {
      end: this.code.length
    };
    html.end = last_child.end;

    delete html.range;

    this._set_location(html);
  }

  "*"(node) {
    if (node[TRAVERSAL_MARKER] === true) {
      throw new Error("Node has already been traversed");
    }

    node[TRAVERSAL_MARKER] = true;
  }

  ":not(TemplateRoot, WhiteSpace):leave"(node) {
    this._update_location(node);
  }

  // prevent duplicate traversal of shorthand property keys
  Property(node) {
    if (node.key === node.value) {
      delete node.value;
    }
  }

  "Property:leave"(node) {
    if (!node.value) {
      node.value = node.key;
    }
  }

  TemplateRoot(node) {
    const { css, instance: js_instance, module: js_module } = node;

    if (css) {
      css.type = "StyleElement";
    }

    if (js_instance) {
      js_instance.type = "ScriptElement";
    }

    if (js_module) {
      js_module.type = "ScriptElement";
    }
  }

  Text(node) {
    this.tokens.push(
      this._update_location({
        type: "Text",
        start: node.start,
        end: node.end,
        value: node.data
      })
    );
  }

  Attribute(node) {
    this.tokens.push(
      this._update_location({
        type: "Text",
        start: node.start,
        end: node.start + node.name.length,
        value: node.name
      })
    );
  }

  [TAG_NODE_ENTER](node) {
    const { start_offset, start_value } = TAG_LOCATIONS[node.type];
    this._add_tag_token(node.start, start_offset, start_value);

    const { end_offset, end_value } = TAG_LOCATIONS[node.type];
    this._add_tag_token(node.end - 1, end_offset, end_value);
  }

  [EXPRESSION_NODE_ENTER](node) {
    this._enter_offset_parent(node);
    return this._parse_template_expression(node);
  }

  [EXPRESSION_NODE_LEAVE]() {
    this._leave_offset_parent();
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
    this._enter_offset_parent(node);
    return this._parse_template_expression(node);
  }

  [`${IMPORTED_COMPONENT_REFERENCE} > .identifier:leave`]() {
    this._leave_offset_parent();
  }

  "EachBlock > .context"(node) {
    this._enter_offset_parent(node);
    return this._parse_template_expression(node);
  }

  "EachBlock > .context:leave"(node) {
    this._leave_offset_parent(node);
  }

  "EachBlock > .key"(node) {
    this._enter_offset_parent(node);
    return this._parse_template_expression(node);
  }

  "EachBlock > .key:leave"(node) {
    this._leave_offset_parent(node);
  }

  "Fragment:leave"(node) {
    node.type = "Program";
    node.sourceType = "module";
    node.body = node.children;
    delete node.children;
  }

  WhiteSpace() {
    return VisitorOption.Remove;
  }

  "ScriptElement > .content"(node) {
    this._enter_offset_parent(node);
    return this._parse_js_slice(node);
  }

  "ScriptElement > .content:leave"() {
    this._leave_offset_parent();
  }

  "TemplateRoot:leave"(node) {
    this._update_html_body(node.html, node.instance, node.module);
    this._update_html_tokens(node.html);
    this._update_html_location(node.html);
  }
}

module.exports = { Converter };
