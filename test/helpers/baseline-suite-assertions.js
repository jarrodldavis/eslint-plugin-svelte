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

/* eslint-disable no-invalid-this */
function annotation_alongside_missing_items(items, message) {
  if (items.length === 0) {
    return;
  }

  this.indent()
    .annotationBlock(function() {
      this.error(message)
        .newline()
        .appendItems(items, function() {
          this.newline();
        });
    })
    .newline();
}

function annotation_alongside_existing_items(items, message, trailing_comma) {
  if (items.length === 0) {
    return;
  }

  const annotations = this.clone().error(message);

  this.indent().block(function() {
    this.appendItems(items, function() {
      this.text(",").newline();
      annotations.newline();
    });

    if (trailing_comma) {
      this.text(",");
    }
  });

  this.space()
    .annotationBlock(annotations)
    .newline();
}
/* eslint-enable no-invalid-this */

function print_pending_updates(output, path_prefix, pending) {
  output.addStyle("missing", annotation_alongside_missing_items);
  output.addStyle("existing", annotation_alongside_existing_items);

  function unprefix(entry) {
    return entry.path.replace(path_prefix, "") || "./";
  }

  const { to_add, to_update, to_delete } = pending;

  return output
    .append("[")
    .newline()
    .indentLines()
    .missing(to_add.map(unprefix), "missing")
    .existing(to_update.map(unprefix), "should be updated", to_delete.length)
    .existing(to_delete.map(unprefix), "should be removed")
    .outdentLines()
    .append("]");
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
        diff(output) {
          return print_pending_updates(output.clone(), directory, {
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
