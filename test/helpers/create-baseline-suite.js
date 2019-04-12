/* eslint-disable no-process-env, no-sync */
"use strict";

const fs = require("fs");
const { EOL } = require("os");
const path = require("path");

const unexpected = require("unexpected");
const { unexpected_baseline_suite } = require("./baseline-suite-assertions");

const {
  load_baselines,
  NAME,
  IS_DIRECTORY,
  TEMPLATE_PATH,
  TEMPLATE_CONTENTS,
  BASELINE_PATH,
  BASELINE_CONTENTS
} = require("./load-baselines");

const expect = unexpected.clone().use(unexpected_baseline_suite);

const UPDATE_BASELINES = Boolean(process.env.UPDATE_BASELINES);
const BASELINE_ROOT = path.join(__dirname, "../", "baselines/");

class BaselineSuite {
  constructor(name, get_result) {
    this.name = name;
    this.get_result = entry => JSON.parse(JSON.stringify(get_result(entry)));
    this.directory = path.join(BASELINE_ROOT, name, "/");
    this.to_add = [];
    this.to_update = [];
    this.to_delete = [];
    this.up_to_date = [];
  }

  create() {
    suite(this.name, () => {
      this._define_suite(load_baselines(this.name));

      suiteTeardown(() => this._update_snapshots());
    });
  }

  _define_suite(entry) {
    suite(entry[NAME], () => this._suite_callback(entry));
  }

  _suite_callback(entry) {
    if (entry[TEMPLATE_CONTENTS] === undefined) {
      suiteTeardown(() =>
        this.to_delete.push({
          path: entry[BASELINE_PATH],
          contents: IS_DIRECTORY
        })
      );
    } else if (entry[BASELINE_CONTENTS] === undefined) {
      this.to_add.push({ path: entry[BASELINE_PATH], contents: IS_DIRECTORY });
    }

    for (const sub_entry of Object.values(entry)) {
      if (sub_entry[IS_DIRECTORY]) {
        this._define_suite(sub_entry);
      } else {
        this._define_test(sub_entry);
      }
    }
  }

  _define_test(entry) {
    test(entry[NAME], () => this._test_callback(entry));
  }

  _test_callback(entry) {
    const baseline_path = entry[BASELINE_PATH];

    // push-expect-pop becasue `expect` throws

    this.to_delete.push({ path: baseline_path, contents: null });
    expect(entry, "to have a template");
    this.to_delete.pop();

    const result = this.get_result(entry[TEMPLATE_CONTENTS]);

    this.to_add.push({ path: baseline_path, contents: result });
    expect(entry, "to have a baseline");
    this.to_add.pop();

    this.to_update.push({ path: baseline_path, contents: result });
    expect(result, "to equal", entry[BASELINE_CONTENTS]);
    this.to_update.pop();

    this.up_to_date.push(baseline_path);
  }

  _update_snapshots() {
    if (!UPDATE_BASELINES) {
      expect(this, "not to have pending updates");
      return;
    }

    for (const entry of this.to_add) {
      if (entry.contents === IS_DIRECTORY) {
        fs.mkdirSync(entry.path);
      } else {
        fs.writeFileSync(
          entry.path,
          JSON.stringify(entry.contents, null, 2) + EOL
        );
      }
    }

    for (const entry of this.to_update) {
      fs.writeFileSync(
        entry.path,
        JSON.stringify(entry.contents, null, 2) + EOL
      );
    }

    for (const entry of this.to_delete) {
      if (entry.contents === IS_DIRECTORY) {
        fs.rmdirSync(entry.path);
      } else {
        fs.unlinkSync(entry.path);
      }
    }

    this._fail_udpate_mode();
  }

  _fail_udpate_mode() {
    expect.fail({
      message: output => {
        output
          .error("expected")
          .space()
          .append(expect.inspect(this, null, output.clone()))
          .space()
          .error("to not be in update mode")
          .indentLines()
          .newline()
          .indent()
          .text("pending baseline modifications have been saved to disk")
          .space()
          .newline()
          .indent()
          .text("unset UPDATE_BASELINES to run tests normally");
      }
    });
  }
}

function create_root_suite(name, get_result) {
  const suite = new BaselineSuite(name, get_result);
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
