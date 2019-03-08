const { Linter } = require("eslint");
const composer = require("eslint-rule-composer");

const base_rule = new Linter().getRules().get("indent");

const DEFAULT_INDENT_SIZE = 4;
const TAB_INDENT_SIZE = 1;
const INDENT_VALUE_MATCH = /^\d+/;
const PARSE_INT_RADIX = 10;

function ensure_property_is_writable(object, property) {
  if (!object.hasOwnProperty(property)) {
    throw new Error(`Property '${property}' does not exist`);
  }

  const descriptor = Object.getOwnPropertyDescriptor(object, property);
  if (!descriptor.writable) {
    throw new Error(`Property '${property}' is not writable`);
  }
}

const map = composer.mapReports(base_rule, (problem, { options }) => {
  let indentSize = DEFAULT_INDENT_SIZE;
  if (options.length) {
    if (options[0] === "tab") {
      indentSize = TAB_INDENT_SIZE;
    } else {
      indentSize = options[0];
    }
  }

  // replace entire `data` property since the value is a frozen object
  ensure_property_is_writable(problem, "data");
  problem.data = {
    actual: problem.data.actual,
    expected: problem.data.expected
      .toString()
      .replace(
        INDENT_VALUE_MATCH,
        number => parseInt(number, PARSE_INT_RADIX) + indentSize
      )
  };

  return problem;
});

const filter = composer.filterReports(map, ({ data }) => {
  const [actual] = data.actual.toString().match(INDENT_VALUE_MATCH);
  const [expected] = data.expected.toString().match(INDENT_VALUE_MATCH);

  return actual !== expected;
});

module.exports = filter;
