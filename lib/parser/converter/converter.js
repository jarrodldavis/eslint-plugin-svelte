"use strict";

const { VisitorOption } = require("estraverse");

const { NodeSyntaxError } = require("../errors");

const { BaseVisitor } = require("./base-visitor");
const { mix } = require("./helpers/mixin-builder");
const { ExpressionParserMixin } = require("./expression-parser");
const { ScriptBlockParserMixin } = require("./script-block-parser");
const { PositionUpdaterMixin } = require("./position-updater");
const { TagTokenizerMixin } = require("./tag-tokenizer");

const MixedInVisitor = mix(BaseVisitor).with(
  ExpressionParserMixin,
  ScriptBlockParserMixin,
  PositionUpdaterMixin,
  TagTokenizerMixin
);

const TRAVERSAL_MARKER = Symbol("eslint-plugin-svelte traversal marker");

const CODE = Symbol("Converter.code");
const TOKENS = Symbol("Converter.tokens");
const COMMENTS = Symbol("Converter.comments");

class Converter extends MixedInVisitor {
  constructor(code, options) {
    const tokens = [];
    const comments = [];
    super({ code, parser_options: options, tokens, comments });
    this[CODE] = code;
    this[TOKENS] = tokens;
    this[COMMENTS] = comments;
  }

  "*"(node) {
    if (node[TRAVERSAL_MARKER] === true) {
      throw new NodeSyntaxError(
        node,
        "Node has already been traversed",
        this[CODE]
      );
    }

    node[TRAVERSAL_MARKER] = true;
  }

  // prevent duplicate traversal of shorthand property keys
  Property(node) {
    if (node.key === node.value) {
      delete node.value;
    } else if (
      node.value.type === "AssignmentPattern" &&
      node.key === node.value.left
    ) {
      delete node.value.left;
    }
  }

  "Property:leave"(node) {
    if (!node.value) {
      node.value = node.key;
    } else if (node.value.type === "AssignmentPattern" && !node.value.left) {
      node.value.left = node.key;
    }
  }

  ImportSpecifier(node) {
    if (node.imported === node.local) {
      delete node.local;
    }
  }

  "ImportSpecifier:leave"(node) {
    if (!node.local) {
      node.local = node.imported;
    }
  }

  Comment(node) {
    this[COMMENTS].push({
      type: "Block",
      value: node.data,
      start: node.start,
      end: node.end
    });
  }

  WhiteSpace() {
    return VisitorOption.Remove;
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

  "TemplateRoot:leave"(node) {
    const { html, instance: js_instance, module: js_module } = node;

    html.type = "Program";
    html.sourceType = "module";
    html.body = html.children;
    delete html.children;

    if (js_instance) {
      html.body.push(...js_instance.content.body);
    }
    if (js_module) {
      html.body.push(...js_module.content.body);
    }

    html.tokens = this[TOKENS];
    html.comments = this[COMMENTS];
  }
}

module.exports = { Converter };
