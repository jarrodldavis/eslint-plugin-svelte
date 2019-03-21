"use strict";

const { getLineInfo } = require("acorn");

const CODE = Symbol("PositionUpdater.code");
const SET_LOCATION = Symbol("PositionUpdater.set_location()");

function by_range(positionable1, positionable2) {
  return positionable1.range[0] - positionable2.range[0];
}

function PositionUpdaterMixin(SuperClass) {
  return class PositionUpdater extends SuperClass {
    constructor(options) {
      super(options);
      this[CODE] = options.code;
    }

    [SET_LOCATION](node) {
      if (Array.isArray(node.range) || node.loc instanceof Object) {
        return;
      }

      const { start, end } = node;

      node.range = [start, end];
      node.loc = {
        start: getLineInfo(this[CODE], start),
        end: getLineInfo(this[CODE], end)
      };
    }

    ":not(TemplateRoot, WhiteSpace):leave"(node) {
      this[SET_LOCATION](node);
    }

    "TemplateRoot:leave"(node) {
      const { html } = node;

      html.body.sort(by_range);

      html.tokens.forEach(this[SET_LOCATION], this);
      html.tokens.sort(by_range);

      html.comments.forEach(this[SET_LOCATION], this);
      html.comments.sort(by_range);

      const first_child = html.tokens[0] || { start: 0 };
      html.start = first_child.start;

      const last_child = html.tokens[html.tokens.length - 1] || {
        end: this[CODE].length
      };
      html.end = last_child.end;

      delete html.range;
      delete html.loc;
      this[SET_LOCATION](html);
    }
  };
}

module.exports = { PositionUpdaterMixin };
