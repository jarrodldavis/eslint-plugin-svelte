declare module "eslint-scope/lib/referencer" {
  import { Node, Identifier, AssignmentExpression } from "estree";
  import { Visitor } from "esrecurse";
  import { Scope, ScopeManager, AnalysisOptions } from "eslint-scope";

  interface ImplicitGlobal {
    pattern: Identifier;
    node: Node;
  }

  interface VisitPatternOptions {
    processRightHandNodes?: boolean;
  }

  interface VisitPatternInfo {
    assignments: AssignmentExpression[];
  }

  type VisitPatternCallback = (
    identifier: Identifier,
    info: VisitPatternInfo
  ) => void;

  export default class Referencer extends Visitor {
    protected scopeManager: ScopeManager;

    constructor(options: AnalysisOptions, scopeManager: ScopeManager);

    currentScope(): Scope;

    close(node: Node): void;

    referencingDefaultValue(
      pattern: Identifier,
      assignments: AssignmentExpression[],
      maybeImplicitGlobal: null | ImplicitGlobal,
      init: boolean
    ): void;

    visitPattern(node: Node, callback: VisitPatternCallback): void;
    visitPattern(
      node: Node,
      options: VisitPatternOptions,
      callback: VisitPatternCallback
    ): void;
  }
}
