"use strict";

const { Linter } = require("eslint");
const composer = require("eslint-rule-composer");

const base_rule = new Linter().getRules().get("no-labels");

module.exports = composer.filterReports(base_rule, problem => {
  if (problem.node.type === "BreakStatement") {
    return true;
  }

  if (problem.node.type !== "LabeledStatement") {
    throw new Error(`Unexpected node type '${problem.node.type}'`);
  }

  return problem.node.label.name !== "$";
});
