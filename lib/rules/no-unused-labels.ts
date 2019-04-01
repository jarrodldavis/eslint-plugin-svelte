"use strict";

const { Linter } = require("eslint");
const composer = require("eslint-rule-composer");

const base_rule = new Linter().getRules().get("no-unused-labels");

module.exports = composer.filterReports(base_rule, problem => {
  if (problem.node.type !== "Identifier") {
    throw new Error(`Unexpected node type '${problem.node.type}'`);
  }

  return problem.node.name !== "$";
});
