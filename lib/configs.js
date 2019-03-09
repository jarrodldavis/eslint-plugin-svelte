"use strict";

const eslint_recommended_overrides = {
  "@jarrodldavis/svelte/no-unused-labels": "error",
  "no-unused-labels": "off"
};

const eslint_all_overrides = {
  ...eslint_recommended_overrides,
  "@jarrodldavis/svelte/indent": "error",
  "@jarrodldavis/svelte/no-labels": "error",
  indent: "off",
  "no-labels": "off"
};

const configs = {
  "eslint:all": {
    extends: ["eslint:all"],
    parser: "@jarrodldavis/eslint-plugin-svelte",
    plugins: ["@jarrodldavis/svelte"],
    rules: eslint_all_overrides
  },
  "eslint:recommended": {
    extends: ["eslint:recommended"],
    parser: "@jarrodldavis/eslint-plugin-svelte",
    plugins: ["@jarrodldavis/svelte"],
    rules: eslint_recommended_overrides
  }
};

module.exports = { configs };
