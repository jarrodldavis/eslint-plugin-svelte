"use strict";

import compiler_warnings from "./compiler-warnings";
import indent from "./indent";
import no_labels from "./no-labels";
import no_unused_labels from "./no-unused-labels";

export const rules = {
  "compiler-warnings": compiler_warnings,
  indent,
  "no-labels": no_labels,
  "no-unused-labels": no_unused_labels
};
