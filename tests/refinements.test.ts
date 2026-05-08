import {
  refine, min, max, length, pattern, nonEmpty, int,
  string, number, integer, array, decode, safeDecode, DecodeError,
} from "../src";

describe("refine_predicate_and_message", () => {
  test("passes when predicate succeeds", () => {
    const d = refine(integer, (n) => n > 0, "positive integer");
    expect(decode(d, 1)).toBe(1);
  });
  test("fails with the expected message", () => {
    const d = refine(integer, (n) => n > 0, "positive integer");
    const r = safeDecode(d, -1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.expected).toBe("positive integer");
  });
  test("propagates inner failure unchanged", () => {
    const d = refine(integer, () => true, "any int");
    const r = safeDecode(d, "no");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.expected).toBe("integer");
  });
});

describe("min_max_constraints", () => {
  test("min accepts threshold", () => {
    expect(decode(min(number, 0), 0)).toBe(0);
  });
  test("min rejects below threshold", () => {
    expect(() => decode(min(number, 0), -0.5)).toThrow(DecodeError);
  });
  test("max accepts threshold", () => {
    expect(decode(max(number, 10), 10)).toBe(10);
  });
  test("max rejects above threshold", () => {
    expect(() => decode(max(number, 10), 11)).toThrow(DecodeError);
  });
  test("composes min and max", () => {
    const d = max(min(number, 0), 10);
    expect(decode(d, 5)).toBe(5);
    expect(() => decode(d, -1)).toThrow(DecodeError);
    expect(() => decode(d, 11)).toThrow(DecodeError);
  });
});

describe("length_constraints", () => {
  test("string length ok inside bounds", () => {
    expect(decode(length(string, { min: 1, max: 3 }), "ab")).toBe("ab");
  });
  test("string length rejects below min", () => {
    expect(() => decode(length(string, { min: 1 }), "")).toThrow(DecodeError);
  });
  test("string length rejects above max", () => {
    expect(() => decode(length(string, { max: 2 }), "abc")).toThrow(DecodeError);
  });
  test("array length works the same", () => {
    expect(decode(length(array(string), { min: 1 }), ["x"])).toEqual(["x"]);
    expect(() => decode(length(array(string), { min: 1 }), [])).toThrow(DecodeError);
  });
  test("default lower bound is 0 and upper is inf", () => {
    expect(decode(length(string, {}), "")).toBe("");
    expect(decode(length(array(string), {}), [])).toEqual([]);
  });
  test("constructor rejects invalid bounds", () => {
    expect(() => length(string, { min: -1 })).toThrow();
    expect(() => length(string, { min: 5, max: 1 })).toThrow();
  });
});

describe("pattern_string_regex", () => {
  test("accepts matching strings", () => {
    expect(decode(pattern(string, /^[A-Z]+$/), "ABC")).toBe("ABC");
  });
  test("rejects non-matching strings", () => {
    expect(() => decode(pattern(string, /^[A-Z]+$/), "abc")).toThrow(DecodeError);
  });
});

describe("nonEmpty_string_or_array", () => {
  test("accepts non-empty string", () => {
    expect(decode(nonEmpty(string), "x")).toBe("x");
  });
  test("rejects empty string", () => {
    expect(() => decode(nonEmpty(string), "")).toThrow(DecodeError);
  });
  test("accepts non-empty array", () => {
    expect(decode(nonEmpty(array(string)), ["x"])).toEqual(["x"]);
  });
  test("rejects empty array", () => {
    expect(() => decode(nonEmpty(array(string)), [])).toThrow(DecodeError);
  });
});

describe("int_refines_number", () => {
  test("accepts integer numbers", () => {
    expect(decode(int(number), 42)).toBe(42);
  });
  test("rejects non-integer numbers", () => {
    expect(() => decode(int(number), 1.5)).toThrow(DecodeError);
  });
});
