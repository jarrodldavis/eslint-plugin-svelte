"use strict";

import { Linter } from "eslint";
import composer from "eslint-rule-composer";

const base_rule = new Linter().getRules().get("no-labels");

export default composer.filterReports(base_rule, problem => {
  if (problem.node.type !== "LabeledStatement") {
    throw new Error(`Unexpected node type '${problem.node.type}'`);
  }

  return problem.node.label.name !== "$";
});
