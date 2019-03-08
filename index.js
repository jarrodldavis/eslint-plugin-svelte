const { parse } = require("./lib/parser");
const { rules } = require("./lib/rules");
const { configs } = require("./lib/configs");

module.exports = {
  parseForESLint: parse,
  rules,
  configs
};
