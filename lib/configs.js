const eslint_recommended_overrides = {
  "no-unused-labels": "off",
  "@jarrodldavis/svelte/no-unused-labels": "error"
};

const eslint_all_overrides = {
  ...eslint_recommended_overrides,
  "no-labels": "off",
  "@jarrodldavis/svelte/no-labels": "error",
  indent: "off",
  "@jarrodldavis/svelte/indent": "error"
};

const configs = {
  "eslint:recommended": {
    extends: ["eslint:recommended"],
    plugins: ["@jarrodldavis/svelte"],
    rules: eslint_recommended_overrides
  },
  "eslint:all": {
    extends: ["eslint:all"],
    plugins: ["@jarrodldavis/svelte"],
    rules: eslint_all_overrides
  }
};

module.exports = { configs };
