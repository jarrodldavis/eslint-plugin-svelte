/* eslint-disable no-sync */
"use strict";

const fs = require("fs");
const path = require("path");

class RecursiveDirectoryReader {
  constructor(root_directory, files_to_skip, directory_regex, file_regex) {
    this.root_directory = root_directory;
    this.files_to_skip = files_to_skip;
    this.directory_regex = directory_regex;
    this.file_regex = file_regex;
  }

  all_entries() {
    try {
      return Object.freeze(Array.from(this._get_entries(this.root_directory)));
    } catch (error) {
      if (!error.code === "ENOENT") {
        throw error;
      }

      return [];
    }
  }

  _get_name(entry, full_path, regex) {
    const match = entry.name.match(regex);

    if (!match) {
      throw new Error(
        `Unexpected name '${entry.name}' for entry '${full_path}'`
      );
    }

    const matched_name = match.groups.name;

    if (!matched_name) {
      throw new Error(
        `Unexpected name '${entry.name}' for entry '${full_path}'`
      );
    }

    return matched_name;
  }

  *_get_entries(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full_path = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        yield Object.freeze({
          name: this._get_name(entry, full_path, this.directory_regex),
          full_path,
          directory: true,
          entries: Object.freeze(Array.from(this._get_entries(full_path)))
        });
      } else if (entry.isFile()) {
        if (this.files_to_skip.includes(entry.name)) {
          continue;
        }

        yield Object.freeze({
          name: this._get_name(entry, full_path, this.file_regex),
          full_path,
          directory: false,
          contents: fs.readFileSync(full_path, { encoding: "utf-8" })
        });
      } else {
        throw new Error(`Unexpected type for directory entry '${full_path}'`);
      }
    }
  }
}

function read_recursive(
  root_directory,
  files_to_skip,
  directory_regex,
  file_regex
) {
  const reader = new RecursiveDirectoryReader(
    root_directory,
    files_to_skip,
    directory_regex,
    file_regex
  );
  return reader.all_entries();
}

module.exports = { read_recursive };
