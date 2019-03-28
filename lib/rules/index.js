/* eslint-disable global-require */
"use strict";

module.exports = {
  rules: {
    "compiler-warnings": require("./compiler-warnings"),
    indent: require("./indent"),
    "no-labels": require("./no-labels"),
    "no-unused-labels": require("./no-unused-labels")
  }
};
