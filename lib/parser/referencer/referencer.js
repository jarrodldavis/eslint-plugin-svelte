/* eslint-disable new-cap */
"use strict";
const { Variable } = require("eslint-scope");
const Referencer = require("eslint-scope/lib/referencer");
const { Definition } = require("eslint-scope/lib/definition");
const { BlockScope } = require("eslint-scope/lib/scope");

class SvelteReferencer extends Referencer {
  visitTemplateDeclaration(node, parent) {
    const scope = this.currentScope();

    const handle_identifier = (identifier, info) => {
      scope.__define(
        identifier,
        new Definition(Variable.Variable, identifier, parent, null, 0, "const")
      );
      this.referencingDefaultValue(identifier, info.assignments, null, true);
    };

    this.visitPattern(node, { processRightHandNodes: true }, handle_identifier);
  }

  Fragment() {
    throw new Error("Fragment nodes should be converted to Program nodes");
  }

  AwaitBlock(node) {
    this.scopeManager.__nestScope(
      new BlockScope(this.scopeManager, this.currentScope(), node)
    );

    if (node.value) {
      this.visitTemplateDeclaration(node.value, node);
    }

    this.visitChildren(node);
    this.close(node);
  }

  PendingBlock(node) {
    this.BlockStatement(node);
  }

  ThenBlock(node) {
    this.scopeManager.__nestScope(
      new BlockScope(this.scopeManager, this.currentScope(), node)
    );

    if (node.value) {
      this.visitTemplateDeclaration(node.value, node);
    }

    this.visitChildren(node);
    this.close(node);
  }

  CatchBlock(node) {
    this.scopeManager.__nestScope(
      new BlockScope(this.scopeManager, this.currentScope(), node)
    );

    if (node.error) {
      this.visitTemplateDeclaration(node.error, node);
    }

    this.visitChildren(node);
    this.close(node);
  }

  EachBlock(node) {
    this.scopeManager.__nestScope(
      new BlockScope(this.scopeManager, this.currentScope(), node)
    );

    this.visitTemplateDeclaration(node.context, node);

    if (node.index) {
      this.visitTemplateDeclaration(node.index, node);
    }

    this.visitChildren(node);
    this.close(node);
  }

  IfBlock(node) {
    this.BlockStatement(node);
  }

  ElseBlock(node) {
    this.BlockStatement(node);
  }

  InlineComponent(node) {
    this.scopeManager.__nestScope(
      new BlockScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  Let(node) {
    const scope = this.currentScope();

    if (scope.type !== "block") {
      throw new Error(`Expected block scope, got '${scope.type}'`);
    }

    if (scope.block.type !== "InlineComponent") {
      throw new Error(
        `Expected scope for InlineComponet, got scope for '${scope.block.type}'`
      );
    }

    if (node.expression) {
      this.visitTemplateDeclaration(node.expression, node);
    } else if (node.name) {
      this.visitTemplateDeclaration(node.name, node);
    } else {
      throw new Error(
        "Expected let directive to contain a declaration identifier"
      );
    }
  }
}

module.exports = { SvelteReferencer };
