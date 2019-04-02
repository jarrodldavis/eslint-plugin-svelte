/* eslint-disable new-cap */
"use strict";

import { NodeSyntaxError } from "../errors";

import { Variable, Reference } from "eslint-scope";
import Referencer from "eslint-scope/lib/referencer";
import { Definition } from "eslint-scope/lib/definition";
import { BlockScope } from "eslint-scope/lib/scope";

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

  Fragment(node) {
    throw new NodeSyntaxError(
      node,
      "Fragment nodes should be converted to Program nodes"
    );
  }

  LabeledStatement(node) {
    const { body } = node;
    if (body.type !== "ExpressionStatement") {
      super.LabeledStatement(node);
      return;
    }

    const { expression } = body;
    if (expression.type !== "AssignmentExpression") {
      super.LabeledStatement(node);
      return;
    }

    const { left: assignee, right: assignment } = expression;
    if (assignee.type !== "Identifier") {
      super.LabeledStatement(node);
      return;
    }

    this.visitTemplateDeclaration(assignee, node);
    this.currentScope().__referencing(
      assignee,
      Reference.WRITE,
      assignment,
      null,
      false,
      true
    );
    this.visit(assignment);
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

    if (scope.type !== "block" || scope.block.type !== "InlineComponent") {
      throw new NodeSyntaxError(
        node,
        "Unexpected let directive for non-component tag"
      );
    }

    if (node.expression) {
      this.visitTemplateDeclaration(node.expression, node);
    } else if (node.name) {
      this.visitTemplateDeclaration(node.name, node);
    } else {
      throw new NodeSyntaxError(
        node,
        "Expected let directive to contain a declaration identifier"
      );
    }
  }
}

export { SvelteReferencer };
