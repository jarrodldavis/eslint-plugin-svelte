"use strict";

const path = require("path");

const { read_recursive } = require("./read-recursive");

const TEMPLATE_ROOT = path.join(__dirname, "../", "templates/");
const FILES_TO_SKIP = [".eslintrc.json"];
const FILE_REGEX = /^\d\d\.(?<name>[a-z-[\]]+)\.svelte$/u;
const DIRECTORY_REGEX = /^\d\d\.(?<name>[a-z-[\]]+)$/u;

module.exports = {
  TEMPLATE_ROOT,
  templates: read_recursive(
    TEMPLATE_ROOT,
    FILES_TO_SKIP,
    DIRECTORY_REGEX,
    FILE_REGEX
  )
};
