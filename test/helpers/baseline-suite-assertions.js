"use strict";

const type_definition = {
  name: "BaselineSuite",
  identify(value) {
    return (
      value instanceof Object && value.constructor.name === "BaselineSuite"
    );
  },
  inspect(value, depth, output, inspect) {
    const { name, directory } = value;

    return output
      .append("BaselineSuite(")
      .append(inspect({ name, directory }, depth))
      .append(")");
  }
};

function print_add_line(output, path) {
  output
    .newline()
    .indent()
    .error("// missing")
    .space()
    .append(path);
}

function print_update_line(output, path, delimiter) {
  output
    .newline()
    .indent()
    .append(path)
    .text(delimiter)
    .space()
    .error("// should be updated");
}

function print_delete_line(output, path, delimiter) {
  output
    .newline()
    .indent()
    .append(path)
    .text(delimiter)
    .space()
    .error("// should be removed");
}

function print_pending_updates(output, inspect, baseline_directory, pending) {
  const { to_add, to_update, to_delete } = pending;

  output.append("[").indentLines();

  const total = to_add.length + to_update.length + to_delete.length;
  let current = 0;

  function delimiter() {
    current += 1;
    return current < total ? "," : "";
  }

  function unprefix(entry_path) {
    return entry_path.replace(baseline_directory, "") || "./";
  }

  for (const entry of to_add) {
    print_add_line(output, inspect(unprefix(entry.path)), delimiter());
  }

  for (const entry of to_update) {
    print_update_line(output, inspect(unprefix(entry.path)), delimiter());
  }

  for (const entry of to_delete) {
    print_delete_line(output, inspect(unprefix(entry.path)), delimiter());
  }

  output
    .nl()
    .outdentLines()
    .append("]");

  return output;
}

function assert_no_pending_updates(expect, suite) {
  const { directory, to_add, to_update, to_delete } = suite;

  expect.withError(
    function() {
      expect(to_add, "to be empty");
      expect(to_update, "to be empty");
      expect(to_delete, "to be empty");
    },
    function() {
      expect.fail({
        diff(output, _diff, inspect) {
          return print_pending_updates(output, inspect, directory, {
            to_add,
            to_update,
            to_delete
          });
        }
      });
    }
  );
}

const unexpected_baseline_suite = {
  name: "baseline-suite",
  installInto(expect) {
    expect.addType(type_definition);
    expect.addAssertion(
      "<BaselineSuite> not to have pending updates",
      assert_no_pending_updates
    );
  }
};

module.exports = { unexpected_baseline_suite };
