declare module "esrecurse" {
  import { Node } from "estree";
  import { VisitorKeys } from "eslint-visitor-keys";

  // https://stackoverflow.com/a/50125960/594538
  type DiscriminatedUnionRecord<
    T extends Record<K, string>,
    K extends keyof T
  > = { [V in T[K]]: T extends Record<K, V> ? T : never };

  type NodeTypes = DiscriminatedUnionRecord<Node, "type">;

  export type VisitorHandlers = Partial<
    { [T in keyof NodeTypes]: (node: NodeTypes[T]) => void }
  >;

  type Options = {
    childVisitorKeys?: VisitorKeys;
    fallback: "iteration" | ((node: Node) => string[]);
  };

  export class Visitor {
    constructor(visitor?: VisitorHandlers, options?: Options);

    visit(node: Node): void;
    visitChildren(node: Node): void;
  }

  export const version: string;
  export function visit(
    node: Node,
    visitor: VisitorHandlers,
    options?: Options
  ): void;
}
