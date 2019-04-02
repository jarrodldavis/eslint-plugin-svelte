"use strict";

const COMPILER_WARNING_RULE_ID = "@jarrodldavis/svelte/compiler-warnings";

function preprocess(text) {
  return [text];
}

function postprocess(problems) {
  for (const problem of problems[0]) {
    if (problem.ruleId !== COMPILER_WARNING_RULE_ID) {
      continue;
    }

    const [compiler_code, compiler_message] = problem.message.split(": ");

    problem.ruleId += `/${compiler_code}`;
    problem.message = compiler_message;
  }

  return problems[0];
}

const processors = {
  ".svelte": { preprocess, postprocess }
};

export { processors };
