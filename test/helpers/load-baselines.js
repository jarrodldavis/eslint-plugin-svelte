"use strict";

const path = require("path");

const { read_recursive } = require("./read-recursive");
const { templates, TEMPLATE_ROOT } = require("./load-templates");

const BASELINE_ROOT = path.join(__dirname, "../", "baselines/");
const FILES_TO_SKIP = [];
const FILE_REGEX = /^\d\d\.(?<name>[a-z-[\]]+)\.svelte.json$/u;
const DIRECTORY_REGEX = /^\d\d\.(?<name>[a-z-[\]]+)$/u;

const NAME = Symbol("name");
const TEMPLATE_PATH = Symbol("template path");
const TEMPLATE_CONTENTS = Symbol("template contents");
const BASELINE_PATH = Symbol("baseline path");
const BASELINE_CONTENTS = Symbol("baseline contents");
const IS_DIRECTORY = Symbol("is directory");

function swap(entry, search, replacement) {
  let new_path = entry.full_path.replace(search.prefix, replacement.prefix);

  if (!entry.directory) {
    new_path = new_path.replace(search.suffix, replacement.suffix);
  }

  return new_path;
}

class BaselineLoader {
  constructor(name) {
    this.name = name;
    this.baseline_directory = path.join(BASELINE_ROOT, name, "/");
    this.result = {};
    this._transform_template = this._transform_template.bind(this);
    this._transform_baseline = this._transform_baseline.bind(this);
  }

  load() {
    if (templates) {
      this._handle_root_entry(templates, TEMPLATE_ROOT);
    }

    const baselines = read_recursive(
      this.baseline_directory,
      FILES_TO_SKIP,
      DIRECTORY_REGEX,
      FILE_REGEX
    );

    if (baselines) {
      this._handle_root_entry(baselines, this.baseline_directory);
    }

    return this.result.root;
  }

  _handle_root_entry(entries, full_path) {
    if (!entries) {
      return;
    }

    const transform =
      full_path === TEMPLATE_ROOT
        ? this._transform_template
        : this._transform_baseline;

    this._handle_entry(
      { name: "root", full_path, directory: true, entries },
      this.result,
      transform
    );
  }

  _handle_entry(entry, parent, transform) {
    const merged_entry = parent[entry.name] || {};
    parent[entry.name] = merged_entry;

    Object.assign(merged_entry, transform(entry));

    if (!entry.directory) {
      return;
    }

    for (const sub_entry of entry.entries) {
      this._handle_entry(sub_entry, merged_entry, transform);
    }
  }

  _transform_common(entry) {
    return {
      [NAME]: entry.name,
      [IS_DIRECTORY]: entry.directory
    };
  }

  _transform_template(entry) {
    return {
      ...this._transform_common(entry),
      [TEMPLATE_PATH]: entry.full_path,
      [TEMPLATE_CONTENTS]: entry.directory ? IS_DIRECTORY : entry.contents,
      [BASELINE_PATH]: swap(
        entry,
        { prefix: TEMPLATE_ROOT, suffix: /$/u },
        { prefix: this.baseline_directory, suffix: ".json" }
      )
    };
  }

  _transform_baseline(entry) {
    return {
      ...this._transform_common(entry),
      [BASELINE_PATH]: entry.full_path,
      [BASELINE_CONTENTS]: entry.directory
        ? IS_DIRECTORY
        : JSON.parse(entry.contents),
      [TEMPLATE_PATH]: swap(
        entry,
        { prefix: this.baseline_directory, suffix: /.json$/u },
        { prefix: TEMPLATE_ROOT, suffix: "" }
      )
    };
  }
}

function load_baselines(name) {
  const loader = new BaselineLoader(name);
  return loader.load();
}

module.exports = {
  load_baselines,
  NAME,
  IS_DIRECTORY,
  TEMPLATE_PATH,
  TEMPLATE_CONTENTS,
  BASELINE_PATH,
  BASELINE_CONTENTS,
  BASELINE_ROOT
};
