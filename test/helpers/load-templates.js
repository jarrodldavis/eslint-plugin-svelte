/* eslint-disable no-sync */
"use strict";

const fs = require("fs");
const path = require("path");

const TEMPLATE_DIR = path.join(__dirname, "../", "templates/");
const FILES_TO_SKIP = [".eslintrc.json"];
const NAME_REGEX = /^\d\d\.(?<name>[a-z-[\]]+)(?:\.svelte)?$/u;

function get_name(entry, full_path) {
  const match = entry.name.match(NAME_REGEX);

  if (!match) {
    throw new Error(`Unexpected name '${entry.name}' for entry '${full_path}'`);
  }

  const matched_name = match.groups.name;

  if (!matched_name) {
    throw new Error(`Unexpected name '${entry.name}' for entry '${full_path}'`);
  }

  return matched_name;
}

function* get_entries(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full_path = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      yield Object.freeze({
        name: get_name(entry, full_path),
        full_path,
        directory: true,
        entries: Object.freeze(Array.from(get_entries(full_path)))
      });
    } else if (entry.isFile()) {
      if (FILES_TO_SKIP.includes(entry.name)) {
        continue;
      }

      yield Object.freeze({
        name: get_name(entry, full_path),
        full_path,
        directory: false,
        contents: fs.readFileSync(full_path, { encoding: "utf-8" })
      });
    } else {
      throw new Error(`Unexpected type for directory entry '${full_path}'`);
    }
  }
}

module.exports = {
  templates: Object.freeze(Array.from(get_entries(TEMPLATE_DIR)))
};
