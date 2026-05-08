import {
  string, number, integer, boolean, null_, unknown_,
  decode, safeDecode, DecodeError,
} from "../src";

describe("primitives_string_accepts_string_returns_string", () => {
  test("decodes the empty string", () => {
    expect(decode(string, "")).toBe("");
  });
  test("decodes a regular string", () => {
    expect(decode(string, "hello")).toBe("hello");
  });
  test("rejects a number", () => {
    expect(() => decode(string, 42)).toThrow(DecodeError);
  });
  test("rejects null and undefined", () => {
    expect(() => decode(string, null)).toThrow(DecodeError);
    expect(() => decode(string, undefined)).toThrow(DecodeError);
  });
});

describe("primitives_number_finite_only", () => {
  test("decodes integers", () => {
    expect(decode(number, 0)).toBe(0);
    expect(decode(number, -3)).toBe(-3);
  });
  test("decodes finite floats", () => {
    expect(decode(number, 1.5)).toBe(1.5);
  });
  test("rejects NaN, Infinity, -Infinity", () => {
    expect(() => decode(number, NaN)).toThrow(DecodeError);
    expect(() => decode(number, Infinity)).toThrow(DecodeError);
    expect(() => decode(number, -Infinity)).toThrow(DecodeError);
  });
  test("rejects strings even if numeric-looking", () => {
    expect(() => decode(number, "5")).toThrow(DecodeError);
  });
});

describe("primitives_integer_safe_only", () => {
  test("decodes safe integers", () => {
    expect(decode(integer, 0)).toBe(0);
    expect(decode(integer, 42)).toBe(42);
    expect(decode(integer, -1000)).toBe(-1000);
  });
  test("rejects non-integers", () => {
    expect(() => decode(integer, 1.5)).toThrow(DecodeError);
  });
  test("rejects values outside safe integer range", () => {
    expect(() => decode(integer, Number.MAX_SAFE_INTEGER + 1)).toThrow(DecodeError);
  });
  test("rejects NaN", () => {
    expect(() => decode(integer, NaN)).toThrow(DecodeError);
  });
});

describe("primitives_boolean_only_booleans", () => {
  test("accepts true and false", () => {
    expect(decode(boolean, true)).toBe(true);
    expect(decode(boolean, false)).toBe(false);
  });
  test("rejects truthy/falsy non-booleans", () => {
    expect(() => decode(boolean, 1)).toThrow(DecodeError);
    expect(() => decode(boolean, 0)).toThrow(DecodeError);
    expect(() => decode(boolean, "")).toThrow(DecodeError);
  });
});

describe("primitives_null_only_null", () => {
  test("accepts null", () => {
    expect(decode(null_, null)).toBeNull();
  });
  test("rejects undefined", () => {
    expect(() => decode(null_, undefined)).toThrow(DecodeError);
  });
  test("rejects 0", () => {
    expect(() => decode(null_, 0)).toThrow(DecodeError);
  });
});

describe("primitives_unknown_passes_through", () => {
  test("returns input as-is", () => {
    expect(decode(unknown_, 42)).toBe(42);
    expect(decode(unknown_, null)).toBeNull();
    expect(decode(unknown_, undefined)).toBeUndefined();
    const o = { a: 1 };
    expect(decode(unknown_, o)).toBe(o);
  });
});

describe("primitives_safeDecode_returns_result", () => {
  test("returns ok on success", () => {
    const r = safeDecode(string, "x");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("x");
  });
  test("returns failure with DecodeError on failure", () => {
    const r = safeDecode(string, 1);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(DecodeError);
      expect(r.error.expected).toBe("string");
    }
  });
});
