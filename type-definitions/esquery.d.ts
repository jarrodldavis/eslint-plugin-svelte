declare module "esquery" {
  import { Node } from "estree";

  interface Selector {
    type:
      | "wildcard"
      | "identifier"
      | "field"
      | "matches"
      | "compound"
      | "not"
      | "has"
      | "child"
      | "descendant"
      | "attribute"
      | "sibling"
      | "adjacent"
      | "nth-child"
      | "nth-last-child"
      | "class";
  }

  export function parse(selector: string): Selector;
  export function matches(
    node: Node,
    selector: Selector,
    ancestry: Node[]
  ): boolean;
}
