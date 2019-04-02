import { Node, Identifier } from "estree";
import { Definition } from "eslint-scope/lib/definition";
import { AnalysisOptions } from "eslint-scope";

declare module "eslint-scope" {
  type AssignmentType = Reference.READ | Reference.WRITE | Reference.RW;

  interface ImplicitGlobal {
    pattern: Identifier;
    node: Node;
  }

  interface Scope {
    __define(node: Node, definition: Definition): void;
    __referencing(
      node: Node,
      assign: AssignmentType,
      writeExpr: Node,
      maybeImplicitGlobal: ImplicitGlobal | null,
      partial: boolean,
      init: boolean
    ): void;
  }

  interface ScopeManager {
    new (options: AnalysisOptions): ScopeManager; // TODO: this doesn't work
    __nestScope(scope: Scope): void;
    __currentScope: Scope | null;
  }

  interface Variable {
    constructor(name: string, scope: Scope): Variable; // TODO: this doesn't work
  }

  namespace Variable {
    export const CatchClause = "CatchClause";
    export const Parameter = "Parameter";
    export const FunctionName = "FunctionName";
    export const ClassName = "ClassName";
    export const Variable = "Variable";
    export const ImportBinding = "ImportBinding";
    export const ImplicitGlobalVariable = "ImplicitGlobalVariable";
  }

  namespace Reference {
    export type READ = 0x1;
    export type WRITE = 0x2;
    export type RW = 0x3;

    export const READ = 0x1;
    export const WRITE = 0x2;
    export const RW = 0x3;
  }
}

export {}; // force module augmentation
