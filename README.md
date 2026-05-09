# decoder-ts

Type-safe runtime JSON validators built from composable decoder combinators.

`decoder-ts` lets you describe the *shape* of an `unknown` value once and get back, at runtime, either a typed value or a structured error path. The decoder you build is also the type — `Decoder<T>` carries `T` so `decode()` narrows correctly with no extra casts and no `any` leaks.

```ts
import { string, number, boolean, object, array, optional } from "decoder-ts";

const User = object({
  id: string,
  age: number,
  active: boolean,
  email: optional(string),
  tags: array(string),
});
// type Inferred = DecodedType<typeof User>
//   = { id: string; age: number; active: boolean; email?: string; tags: string[] }

const result = User.decode(JSON.parse(input));
if (result.ok) {
  result.value; // typed Inferred — no `as`
} else {
  result.errors; // [{ path: ["age"], message: "expected number, got string" }, ...]
}
```

## Non-goals

- **Not a schema language with codegen.** You write decoders in TypeScript. There's no JSON Schema parser, no zod-style emit-OpenAPI flow.
- - **No transformation.** A decoder validates and narrows; it doesn't convert `"42"` → `42`. Compose with your own mapper if you need that.
  - - **No async / I/O.** Pure, synchronous, no fetch helpers. Use it inside whatever HTTP layer you already have.
   
    - ## Install
   
    - ```bash
      npm install decoder-ts
      ```

      Zero runtime dependencies. Ships ESM + CJS + `.d.ts`.

      ## Quick start

      ```ts
      import { object, array, string, number, oneOf, literal } from "decoder-ts";

      const Event = object({
        type: oneOf(literal("click"), literal("submit"), literal("scroll")),
        at: number,
        target: string,
        meta: array(string),
      });

      const safeEvent = (raw: unknown) => {
        const r = Event.decode(raw);
        return r.ok ? r.value : null;
      };
      ```

      ## API

      | Combinator | Description |
      |---|---|
      | `string`, `number`, `boolean`, `null_`, `undefined_` | Primitive decoders. |
      | `literal(v)` | Matches one specific value (`"draft"`, `42`, `true`, …). |
      | `array(D)` | `D[]`. Each element decoded; first error short-circuits with index path. |
      | `object({ k: D, ... })` | Strictly-keyed object. Missing required keys and wrong types both yield path-aware errors. |
      | `optional(D)` | Marks a key optional. `undefined` becomes the absent value. |
      | `oneOf(D1, D2, ...)` | Tries each in order. Returns the first success or the union of failure messages. |
      | `tuple(D1, D2, ...)` | Fixed-length array with per-position decoders. |
      | `record(D)` | `{ [k: string]: D }`. Validates every value. |
      | `map(D, fn)` | Applies `fn` to a successful decode (the only way to transform — and only after validation). |
      | `lazy(() => D)` | Recursive decoders without circular-import pain. |

      `decode(unknown) → { ok: true, value: T } | { ok: false, errors: DecodeError[] }`

      `DecodeError = { path: (string|number)[], message: string }`. Paths are jq-readable (`["users", 3, "email"]`).

      ## Why this and not `zod` / `io-ts` / `runtypes`?

      Because sometimes you want ~200 lines of code that does the 80% case and lets you read every line. `decoder-ts` is intentionally smaller in surface area: no async refinements, no transformation pipeline, no schema generation. If you need any of those, reach for a heavier library. If you just need "validate this `unknown` and narrow it," this is enough.

      ## Running tests

      ```bash
      npm install
      npm test
      ```

      `tsc --strict` and `jest` pass on Node 18+.

      ## License

      MIT.
      
