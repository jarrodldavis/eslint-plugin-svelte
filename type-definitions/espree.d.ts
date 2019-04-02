declare module "espree/lib/espree" {
  import acorn from "acorn";

  interface EspreeInstance {}

  type Espree<T extends acorn.Parser> = T;

  export interface Options {
    range?: boolean;
    loc?: boolean;
    comment?: boolean;
    tokens?: boolean;
    ecmaVersion?: acorn.Options["ecmaVersion"];
    sourceType?: acorn.Options["sourceType"];
    ecmaFeatures?: {
      jsx?: boolean;
      globalReturn?: boolean;
      impliedStrict?: boolean;
    };
  }

  interface EspreeConstructor<T extends acorn.Parser = acorn.Parser> {
    new (opts: Options, code: string): Espree<T>;
  }

  function espree(): <T extends acorn.Parser = acorn.Parser>(
    Parser: T
  ) => EspreeConstructor<T>;

  export default espree;
}
