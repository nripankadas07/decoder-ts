import {
  optional, nullable, lazy, map, chain, object, array, string, integer, oneOf,
  decode, safeDecode, DecodeError, Decoder,
} from "../src";

describe("optional_accepts_undefined", () => {
  test("accepts undefined", () => {
    expect(decode(optional(string), undefined)).toBeUndefined();
  });
  test("rejects null (use nullable for null)", () => {
    expect(() => decode(optional(string), null)).toThrow(DecodeError);
  });
  test("delegates to inner decoder for non-undefined", () => {
    expect(decode(optional(string), "x")).toBe("x");
    expect(() => decode(optional(string), 1)).toThrow(DecodeError);
  });
});

describe("nullable_accepts_null", () => {
  test("accepts null", () => {
    expect(decode(nullable(string), null)).toBeNull();
  });
  test("rejects undefined (use optional for undefined)", () => {
    expect(() => decode(nullable(string), undefined)).toThrow(DecodeError);
  });
  test("delegates to inner decoder for non-null", () => {
    expect(decode(nullable(string), "x")).toBe("x");
    expect(() => decode(nullable(string), 1)).toThrow(DecodeError);
  });
});

describe("map_transforms_decoded_value", () => {
  test("uppercases a string", () => {
    expect(decode(map(string, (s) => s.toUpperCase()), "hi")).toBe("HI");
  });
  test("propagates failure unchanged", () => {
    const r = safeDecode(map(string, (s) => s.length), 1);
    expect(r.ok).toBe(false);
  });
});

describe("chain_selects_decoder_from_value", () => {
  type Tagged = { kind: "num"; value: number } | { kind: "str"; value: string };

  function tagged(): Decoder<Tagged> {
    const tag = object({ kind: oneOf("num", "str") });
    return chain(tag, (t) => {
      if (t.kind === "num") return object({ kind: oneOf("num"), value: integer }) as Decoder<Tagged>;
      return object({ kind: oneOf("str"), value: string }) as Decoder<Tagged>;
    });
  }

  test("dispatches based on kind", () => {
    const d = tagged();
    expect(decode(d, { kind: "num", value: 1 })).toEqual({ kind: "num", value: 1 });
    expect(decode(d, { kind: "str", value: "x" })).toEqual({ kind: "str", value: "x" });
  });

  test("propagates first decoder failure", () => {
    const d = tagged();
    const r = safeDecode(d, { kind: "other" });
    expect(r.ok).toBe(false);
  });

  test("propagates second decoder failure", () => {
    const d = tagged();
    const r = safeDecode(d, { kind: "num", value: "wrong" });
    expect(r.ok).toBe(false);
  });
});

describe("lazy_supports_recursive_decoders", () => {
  type Tree = { value: number; children: Tree[] };
  const tree: Decoder<Tree> = lazy(() => object({
    value: integer,
    children: array(tree),
  })) as Decoder<Tree>;

  test("decodes a leaf", () => {
    expect(decode(tree, { value: 1, children: [] })).toEqual({ value: 1, children: [] });
  });

  test("decodes a deep tree", () => {
    const input = {
      value: 1,
      children: [
        { value: 2, children: [{ value: 4, children: [] }] },
        { value: 3, children: [] },
      ],
    };
    expect(decode(tree, input)).toEqual(input);
  });

  test("reports nested error path", () => {
    const r = safeDecode(tree, { value: 1, children: [{ value: "x", children: [] }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.path).toEqual(["children", "0", "value"]);
  });
});
