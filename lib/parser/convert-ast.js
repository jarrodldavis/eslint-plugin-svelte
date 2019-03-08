const { traverse } = require("estraverse");
const { parse, tokenize } = require("espree");
const { KEYS, EXPRESSION_NODES } = require("./keys");
const { add_tag_tokens, add_mustache_tokens } = require("./tokenizer");

const offset_marker = Symbol("eslint-plugin-svelte offset traversal marker");

function convert(ast, code, options) {
  const { html: program, css, module: js_module, instance: js_instance } = ast;
  const lines = get_lines(code);

  program.type = "Program";
  program.sourceType = "module";
  program.body = program.children;
  delete program.children;
  program.tokens = [];
  program.comments = [];

  function offset(amount, positionable) {
    if (
      typeof positionable.start !== "number" ||
      typeof positionable.end !== "number" ||
      !Array.isArray(positionable.range) ||
      positionable[offset_marker] === true
    ) {
      return;
    }

    positionable.start += amount;
    positionable.end += amount;
    positionable.range = positionable.range.map(index => index + amount);
    positionable.loc = get_loc(lines, positionable.start, positionable.end);
    positionable[offset_marker] = true;

    return positionable;
  }

  function tokenize_template_expression(node) {
    const { start, end } = node;
    const slice = code.slice(start, end);

    const offset_position = offset.bind(null, start);

    const node_tokens = tokenize(slice, options);
    program.tokens.push(...node_tokens.map(offset_position));
    program.comments.push(...node_tokens.comments.map(offset_position));
  }

  function set_loc(node) {
    const { start, end } = node;

    if (typeof start !== "number" || typeof end !== "number") {
      // TODO: delete node?
      return;
    }

    node.range = [start, end];
    node.loc = get_loc(lines, start, end);
    return node;
  }

  function tokenize_expression_children(node) {
    if (EXPRESSION_NODES.indexOf(node.type) > -1 && node.expression) {
      tokenize_template_expression(node.expression);
    }

    if (node.type === "InlineComponent" && /[A-Z]/.test(node.name[0])) {
      node.identifier = {
        type: "Identifier",
        name: node.name,
        start: node.start + 1,
        end: node.start + 1 + node.name.length
      };
      tokenize_template_expression(node.identifier);
    }

    if (node.type === "EachBlock") {
      tokenize_template_expression(node.context);
      if (node.key) {
        tokenize_template_expression(node.key);
      }
    }
  }

  function enter(node) {
    set_loc(node);
    tokenize_expression_children(node);
    program.tokens.push(...add_tag_tokens(node).map(set_loc));
    program.tokens.push(...add_mustache_tokens(node, code).map(set_loc));
  }

  traverse(program, { enter, keys: KEYS });

  if (css) {
    css.type = "StyleElement";
    traverse(css, { enter, fallback: "iteration" });
  }

  function convert_js(js_root) {
    // traverse original js tree in case rules operating on template use it
    // i.e. marking the <script> tag with a report (instead of just the js code)
    js_root.type = "ScriptElement";
    traverse(js_root, { enter, keys: { ScriptElement: ["content"] } });

    // reparse js code using espree to get correct `node.range` values
    // (especially for template elements)
    const content_start = js_root.content.start;
    const content_end = js_root.content.end;
    const content_slice = code.slice(content_start, content_end);
    const js_ast = parse(content_slice, options);

    const offset_position = offset.bind(null, content_start);

    traverse(js_ast, { enter: offset_position });

    // push espree info into main tree
    program.body.push(...js_ast.body);
    program.tokens.push(...js_ast.tokens.map(offset_position));
    program.comments.push(...js_ast.comments.map(offset_position));
  }

  if (js_module) {
    convert_js(js_module);
  }

  if (js_instance) {
    convert_js(js_instance);
  }

  program.body.sort((node1, node2) => node1.start - node2.start);
  program.end = Math.max(
    program.end,
    program.body[program.body.length - 1].end
  );
  program.tokens.sort((token1, token2) => token1.range[0] - token2.range[0]);
  program.comments.sort(
    (comment1, comment2) => comment1.range[0] - comment2.range[0]
  );

  return { program, css, js_instance, js_module };
}

function get_lines(code) {
  const split = code.split(/(\r?\n)/);

  let code_index = 0;
  const lines = [];
  for (line_index = 0; line_index < split.length; line_index += 2) {
    const text = split[line_index];
    const eol = split[line_index + 1] || "";

    const length = text.length + eol.length;
    lines.push({ text, eol, start: code_index, end: code_index + length });
    code_index += length;
  }
  return lines;
}

function get_loc(lines, start, end) {
  if (!Array.isArray(lines)) {
    throw new TypeError(`Expected lines to be an array, got '${lines}'`);
  }
  if (!Number.isInteger(start)) {
    throw new TypeError(`Expected start to be an integer, got '${start}'`);
  }
  if (!Number.isInteger(end)) {
    throw new TypeError(`Expected end to be an integer, got '${end}'`);
  }

  const start_line = lines.findIndex(
    line => line.start <= start && line.end > start
  );
  if (start_line === -1) {
    throw new Error(
      `Could not find line for start character position ${start}`
    );
  }

  const start_column = start - lines[start_line].start;

  const end_line = lines.findIndex(
    line => line.start <= end && line.end >= end
  );
  if (end_line === -1) {
    throw new Error(`Could not find line for end character position ${end}`);
  }

  const end_column = end - lines[end_line].start;

  return {
    start: {
      line: start_line + 1, // 1-indexed
      column: start_column
    },
    end: {
      line: end_line + 1, // 1-indexed
      column: end_column
    }
  };
}

module.exports = { convert };
