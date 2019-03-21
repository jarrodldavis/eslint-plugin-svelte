"use strict";

const { getLineInfo, tokTypes, Token } = require("acorn");
const { VisitorOption } = require("estraverse");

const { EXPRESSION_NODES } = require("../keys");
const { TAG_LOCATIONS } = require("./tag-locations");
const { get_parser } = require("./espree");
const { BaseVisitor } = require("./base-visitor");

const EXPRESSION_NODE_ENTER = EXPRESSION_NODES.map(
  type => `${type} > .expression`
).join(", ");
const TAG_NODE_ENTER = Object.keys(TAG_LOCATIONS).join(", ");
const IMPORTED_COMPONENT_REFERENCE = "InlineComponent[name=/^[A-Z]/]";

const TRAVERSAL_MARKER = Symbol("eslint-plugin-svelte traversal marker");

function by_range(positionable1, positionable2) {
  return positionable1.range[0] - positionable2.range[0];
}

function parseExpressionAt(code, base_options, position, assignable) {
  const Parser = get_parser(position);
  const parser = new Parser(base_options, code);

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
  parser.finishToken(tokTypes.eof);
  parser.options.onToken(new Token(parser));

  const { tokens, comments } = parser.get_extras();
  return { expression, tokens, comments };
}

class Converter extends BaseVisitor {
  constructor(code, options) {
    super();
    this.code = code;
    this.options = options;
    this.tokens = [];
    this.comments = [];
  }

  _update_location(node) {
    if (!Number.isInteger(node.start) || !Number.isInteger(node.end)) {
      throw new Error("Node requires start and end location information");
    }

    if (Array.isArray(node.range) || node.loc instanceof Object) {
      return node;
    }

    node.range = [node.start, node.end];
    node.loc = {
      start: getLineInfo(this.code, node.start),
      end: getLineInfo(this.code, node.end)
    };

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

  _parse_template_expression(node, assignable = false) {
    const { expression, tokens, comments } = parseExpressionAt(
      this.code,
      this.options,
      node.start,
      assignable
    );

    if (expression.type !== node.type) {
      throw new Error(
        `Parse result mismatch for template expression: expected '${
          node.type
        }', got '${expression.type}'`
      );
    }

    const offset = this._update_location.bind(this);
    this.tokens.push(...tokens.map(offset));
    this.comments.push(...comments.map(offset));
    return expression;
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
    delete html.loc;
    this._update_location(html);
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
    return this._parse_template_expression(node);
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
    return this._parse_template_expression(node);
  }

  "EachBlock > .context"(node) {
    return this._parse_template_expression(node, true);
  }

  "EachBlock > .key"(node) {
    return this._parse_template_expression(node);
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
    const Parser = get_parser(node.start);
    const program = Parser.parse(this.code.slice(0, node.end), this.options);
    const offset = this._update_location.bind(this);
    this.tokens.push(...program.tokens.map(offset));
    this.comments.push(...program.comments.map(offset));
    return program;
  }

  "TemplateRoot:leave"(node) {
    this._update_html_body(node.html, node.instance, node.module);
    this._update_html_tokens(node.html);
    this._update_html_location(node.html);
  }
}

module.exports = { Converter };
