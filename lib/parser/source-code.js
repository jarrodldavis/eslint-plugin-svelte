"use strict";

class SourceCode {
  constructor(code) {
    this.code = code;
    this.lines = SourceCode.get_lines(code);
  }

  static get_lines(code) {
    const split = code.split(/\r?\n/u);

    let code_index = 0;
    const lines = [];
    for (let line_index = 0; line_index < split.length; line_index += 2) {
      const text = split[line_index];
      const eol = split[line_index + 1] || "";

      const length = text.length + eol.length;
      lines.push({ text, eol, start: code_index, end: code_index + length });
      code_index += length;
    }
    return lines;
  }

  find_position(position) {
    if (!Number.isInteger(position)) {
      throw new TypeError(
        `Expected position to be an integer, got '${position}'`
      );
    }

    const line_index = this.lines.findIndex(
      line => line.start <= position && line.end > position
    );

    if (line_index === -1) {
      throw new Error(`Could not find line for character position ${position}`);
    }

    const column_index = position - this.lines[line_index].start;

    // line is 1-indexed
    return { line: line_index + 1, column: column_index };
  }

  get_loc(start, end) {
    return { start: this.find_position(start), end: this.find_position(end) };
  }
}

module.exports = { SourceCode };
