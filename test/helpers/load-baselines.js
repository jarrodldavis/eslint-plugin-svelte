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

function get_baselines(name) {
  return read_recursive(
    path.join(BASELINE_ROOT, name, "/"),
    FILES_TO_SKIP,
    DIRECTORY_REGEX,
    FILE_REGEX
  );
}

function handle_entry(entry, parent, transform) {
  const merged_entry = parent[entry.name] || {};
  parent[entry.name] = merged_entry;

  Object.assign(merged_entry, transform(entry));

  if (!entry.directory) {
    return;
  }

  for (const sub_entry of entry.entries) {
    handle_entry(sub_entry, merged_entry, transform);
  }
}

function get_baseline_path(baseline_directory, template_entry) {
  let baseline_path = path.join(
    baseline_directory,
    template_entry.full_path.replace(TEMPLATE_ROOT, "")
  );

  if (!template_entry.directory) {
    baseline_path += ".json";
  }

  return baseline_path;
}

function get_template_path(baseline_directory, baseline_entry) {
  let template_path = path.join(
    TEMPLATE_ROOT,
    baseline_entry.full_path.replace(baseline_directory, "")
  );

  if (!baseline_entry.directory) {
    template_path = template_path.replace(/\.json$/u, "");
  }

  return template_path;
}

function transform_template(baseline_directory, entry) {
  return {
    [NAME]: entry.name,
    [IS_DIRECTORY]: entry.directory,
    [TEMPLATE_PATH]: entry.full_path,
    [BASELINE_PATH]: get_baseline_path(baseline_directory, entry),
    [TEMPLATE_CONTENTS]: entry.directory ? IS_DIRECTORY : entry.contents
  };
}

function load_baselines(name) {
  const merged = {};
  const baseline_directory = path.join(BASELINE_ROOT, name, "/");

  handle_entry(
    {
      name: "root",
      full_path: TEMPLATE_ROOT,
      directory: true,
      entries: templates
    },
    merged,
    transform_template.bind(null, baseline_directory)
  );

  function transform_baseline(entry) {
    return {
      [NAME]: entry.name,
      [IS_DIRECTORY]: entry.directory,
      [TEMPLATE_PATH]: get_template_path(baseline_directory, entry),
      [BASELINE_PATH]: entry.full_path,
      [BASELINE_CONTENTS]: entry.directory
        ? IS_DIRECTORY
        : JSON.parse(entry.contents)
    };
  }

  const baselines = get_baselines(name);
  if (baselines) {
    handle_entry(
      {
        name: "root",
        full_path: baseline_directory,
        directory: true,
        entries: baselines
      },
      merged,
      transform_baseline
    );
  }

  return merged.root;
}

module.exports = {
  load_baselines,
  NAME,
  IS_DIRECTORY,
  TEMPLATE_PATH,
  TEMPLATE_CONTENTS,
  BASELINE_PATH,
  BASELINE_CONTENTS
};
