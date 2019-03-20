/* eslint-disable new-cap */
"use strict";
const Referencer = require("eslint-scope/lib/referencer");
const {
  AwaitScope,
  AwaitThenScope,
  AwaitCatchScope,
  EachScope
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
    this.visitChildren(node);
  }
}

module.exports = { SvelteReferencer };
