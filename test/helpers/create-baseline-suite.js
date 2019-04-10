/* eslint-disable no-process-env, no-sync */
"use strict";

const fs = require("fs");
const path = require("path");

const expect = require("unexpected");

const { TEMPLATE_ROOT, templates } = require("./load-templates");

const UPDATE_BASELINES = Boolean(process.env.UPDATE_BASELINES);
const BASELINE_ROOT = path.join(__dirname, "../", "baselines/");

class BaselineSuite {
  constructor(root_name, get_result) {
    this.root_name = root_name;
    this.baseline_directory = path.join(BASELINE_ROOT, root_name);
    this.get_result = get_result;
  }

  create() {
    this._define_suite({
      name: this.root_name,
      full_path: TEMPLATE_ROOT,
      directory: true,
      entries: templates
    });
  }

  _baseline_path(template_path) {
    return path.join(
      this.baseline_directory,
      template_path.replace(TEMPLATE_ROOT, "")
    );
  }

  _get_baseline(template_path) {
    const baseline_path = `${this._baseline_path(template_path)}.json`;

    try {
      return JSON.parse(fs.readFileSync(baseline_path, { encoding: "utf-8" }));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      throw new Error(`Baseline has not yet been saved: ${baseline_path}`);
    }
  }

  _save_baseline(template_path, contents) {
    const baseline_path = `${this._baseline_path(template_path)}.json`;
    fs.writeFileSync(baseline_path, JSON.stringify(contents));
  }

  _define_suite(template_entry) {
    suite(template_entry.name, () => this._suite_callback(template_entry));
  }

  _suite_callback(template_entry) {
    suiteSetup(() => this._suite_setup(template_entry.full_path));

    for (const sub_entry of template_entry.entries) {
      if (sub_entry.directory) {
        this._define_suite(sub_entry);
      } else {
        this._define_test(sub_entry);
      }
    }
  }

  _suite_setup(template_path) {
    if (!UPDATE_BASELINES) {
      return;
    }

    try {
      fs.mkdirSync(this._baseline_path(template_path));
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  _define_test(template_entry) {
    test(template_entry.name, () => this._test_callback(template_entry));
  }

  _test_callback(template_entry) {
    const result = this.get_result();

    if (UPDATE_BASELINES) {
      this._save_baseline(template_entry.full_path, result);
    } else {
      const baseline = this._get_baseline(template_entry.full_path);
      expect(result, "to equal", baseline);
    }
  }
}

function create_root_suite(root_name, get_result) {
  const suite = new BaselineSuite(root_name, get_result);
  suite.create();
}

if (UPDATE_BASELINES) {
  try {
    fs.mkdirSync(BASELINE_ROOT);
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

module.exports = { create_root_suite };
