/* eslint-disable new-cap */
"use strict";
const Referencer = require("eslint-scope/lib/referencer");
const {
  AwaitScope,
  AwaitThenScope,
  AwaitCatchScope,
  EachScope,
  InlineComponentScope
} = require("./scope");

class SvelteReferencer extends Referencer {
  Fragment() {
    throw new Error("Fragment nodes should be converted to Program nodes");
  }

  AwaitBlock(node) {
    this.scopeManager.__nestScope(
      new AwaitScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  PendingBlock(node) {
    this.BlockStatement(node);
  }

  ThenBlock(node) {
    this.scopeManager.__nestScope(
      new AwaitThenScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  CatchBlock(node) {
    this.scopeManager.__nestScope(
      new AwaitCatchScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  EachBlock(node) {
    this.scopeManager.__nestScope(
      new EachScope(this.scopeManager, this.currentScope(), node)
    );
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
      new InlineComponentScope(this.scopeManager, this.currentScope(), node)
    );
    this.visitChildren(node);
    this.close(node);
  }

  Let(node) {
    const scope = this.currentScope();

    if (scope.type !== "svelte:component") {
      throw new Error(`Expected svelte component scope, got '${scope.type}'`);
    }

    if (node.expression) {
      scope.__defineTemplateDestructuringIdentifiers(node.expression);
    } else {
      scope.__defineTemplateIdentifier(node.name);
    }
  }
}

module.exports = { SvelteReferencer };
