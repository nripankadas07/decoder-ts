import {
  tuple, union, oneOf, string, integer, boolean, number, null_,
  decode, safeDecode, DecodeError,
} from "../src";

describe("tuple_decodes_fixed_length", () => {
  test("decodes a 2-tuple", () => {
    const d = tuple(string, integer);
    expect(decode(d, ["a", 1])).toEqual(["a", 1]);
  });

  test("decodes a 3-tuple of mixed types", () => {
    const d = tuple(string, integer, boolean);
    expect(decode(d, ["a", 1, true])).toEqual(["a", 1, true]);
  });

  test("rejects wrong length", () => {
    const d = tuple(string, integer);
    expect(() => decode(d, ["a"])).toThrow(DecodeError);
    expect(() => decode(d, ["a", 1, "extra"])).toThrow(DecodeError);
  });

  test("rejects non-array input", () => {
    const d = tuple(string);
    expect(() => decode(d, "x")).toThrow(DecodeError);
    expect(() => decode(d, { 0: "x", length: 1 })).toThrow(DecodeError);
  });

  test("reports failing element with index", () => {
    const d = tuple(string, integer);
    const r = safeDecode(d, ["a", "b"]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.path).toEqual(["1"]);
    }
  });
});

describe("union_first_match_wins", () => {
  test("returns first matching branch", () => {
    const d = union(string, integer);
    expect(decode(d, "x")).toBe("x");
    expect(decode(d, 7)).toBe(7);
  });

  test("returns aggregate error with branches when none match", () => {
    const d = union(string, integer);
    const r = safeDecode(d, true);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.branches).toBeDefined();
      expect(r.error.branches!.length).toBe(2);
      expect(r.error.expected).toContain("branches");
    }
  });

  test("throws when constructed with no decoders", () => {
    expect(() => union()).toThrow();
  });

  test("supports nullable via union with null_", () => {
    const d = union(string, null_);
    expect(decode(d, null)).toBeNull();
    expect(decode(d, "x")).toBe("x");
  });
});

describe("oneOf_literal_match", () => {
  test("accepts declared literals", () => {
    const d = oneOf("a", "b", "c");
    expect(decode(d, "a")).toBe("a");
    expect(decode(d, "c")).toBe("c");
  });

  test("rejects undeclared literals", () => {
    const d = oneOf("a", "b");
    expect(() => decode(d, "z")).toThrow(DecodeError);
  });

  test("works with mixed literal types", () => {
    const d = oneOf(1, "two", true, null);
    expect(decode(d, 1)).toBe(1);
    expect(decode(d, "two")).toBe("two");
    expect(decode(d, true)).toBe(true);
    expect(decode(d, null)).toBeNull();
  });

  test("throws when constructed with no values", () => {
    expect(() => oneOf()).toThrow();
  });

  test("error message lists allowed values", () => {
    const r = safeDecode(oneOf("a", "b"), "z");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.expected).toContain('"a"');
  });

  // ensure number primitive can be passed as a member without type drift
  test("rejects 1 when only declared as boolean true (Object.is semantics)", () => {
    const d = oneOf(true, false);
    expect(() => decode(d, 1 as unknown as boolean)).toThrow(DecodeError);
    void number; // keep the import used
  });
});
