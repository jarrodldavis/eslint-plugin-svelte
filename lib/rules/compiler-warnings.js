"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "report warnings from the Svelte compiler",
      category: "Possible Errors",
      recommended: true
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          ignore: {
            type: "array",
            uniqueItems: true,
            items: { type: "string" }
          }
        }
      }
    ]
  },
  create(context) {
    const {
      options: [{ ignore }],
      parserServices: { warnings }
    } = context;

    for (const warning of warnings) {
      if (ignore.indexOf(warning.code) > -1) {
        continue;
      }

      context.report({
        message: "{{ code }}: {{ message }}",
        data: warning,
        loc: warning
      });
    }

    return {};
  }
};
