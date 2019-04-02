declare module "eslint-scope/lib/definition" {
  import { Identifier, Node } from "estree";

  export class Definition {
    constructor(
      type: string,
      name: Identifier,
      node: Node,
      parent?: Node,
      index?: number,
      kind?: "var" | "let" | "const"
    );
  }
}
