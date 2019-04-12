"use strict";

const {
  NAME,
  TEMPLATE_PATH,
  TEMPLATE_CONTENTS,
  BASELINE_PATH,
  BASELINE_CONTENTS,
  BASELINE_ROOT
} = require("./load-baselines");

const suite_type_definition = {
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
    return entry.path.replace(path_prefix, "<baseline_directory>/");
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

const entry_type_definition = {
  name: "BaselineEntry",
  identify(value) {
    return (
      value instanceof Object &&
      Object.prototype.hasOwnProperty.call(value, NAME)
    );
  },
  inspect(value, depth, output, inspect) {
    return output
      .append("BaselineEntry(")
      .append(inspect(value[BASELINE_PATH].replace(BASELINE_ROOT, ""), depth))
      .append(")");
  }
};

/* eslint-disable no-invalid-this */
function object_property(object, key, value_override = null, comma = true) {
  this.newline().indent();

  let value = object[key];
  if (value !== undefined && value_override !== null) {
    value = value_override;
  }

  this.propertyForObject(key, this.clone().appendInspected(value));

  if (comma) {
    this.text(",");
  }
}

function path_annotation(is_loaded) {
  this.space();

  if (is_loaded) {
    this.jsComment("// found");
  } else {
    this.error("// not found");
  }
}

function contents_annotation(is_loaded) {
  this.space();

  if (is_loaded) {
    this.jsComment("// loaded");
  } else {
    this.error("// not loaded");
  }
}
/* eslint-enable no-invalid-this */

function print_incomplete_entry(entry, output) {
  output.addStyle("property", object_property);
  output.addStyle("pathAnnotation", path_annotation);
  output.addStyle("contentsAnnotation", contents_annotation);

  return output
    .text("{")
    .indentLines()
    .property(entry, TEMPLATE_PATH)
    .pathAnnotation(entry[TEMPLATE_CONTENTS] !== undefined)
    .property(entry, TEMPLATE_CONTENTS, "...")
    .contentsAnnotation(entry[TEMPLATE_CONTENTS] !== undefined)
    .property(entry, BASELINE_PATH)
    .pathAnnotation(entry[BASELINE_CONTENTS] !== undefined)
    .property(entry, BASELINE_CONTENTS, "...", false)
    .contentsAnnotation(entry[BASELINE_CONTENTS] !== undefined)
    .outdentLines()
    .newline()
    .text("}");
}

function assert_loaded_template(expect, entry) {
  expect.withError(
    function() {
      expect(entry[TEMPLATE_CONTENTS], "to be defined");
    },
    function() {
      expect.fail({
        diff(output) {
          return print_incomplete_entry(entry, output.clone());
        }
      });
    }
  );
}

function assert_loaded_baseline(expect, entry) {
  expect.withError(
    function() {
      expect(entry[BASELINE_CONTENTS], "to be defined");
    },
    function() {
      expect.fail({
        diff(output) {
          return print_incomplete_entry(entry, output.clone());
        }
      });
    }
  );
}

const unexpected_baseline_suite = {
  name: "baseline-suite",
  installInto(expect) {
    expect.addType(suite_type_definition);
    expect.addAssertion(
      "<BaselineSuite> not to have pending updates",
      assert_no_pending_updates
    );

    expect.addType(entry_type_definition);
    expect.addAssertion(
      "<BaselineEntry> to have a template",
      assert_loaded_template
    );

    expect.addAssertion(
      "<BaselineEntry> to have a baseline",
      assert_loaded_baseline
    );
  }
};

module.exports = { unexpected_baseline_suite };
