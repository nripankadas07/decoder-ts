import { array, record, string, integer, decode, safeDecode, DecodeError } from "../src";

describe("array_decodes_homogeneous", () => {
  test("decodes empty array", () => {
    expect(decode(array(string), [])).toEqual([]);
  });
  test("decodes array of strings", () => {
    expect(decode(array(string), ["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });
  test("decodes array of numbers", () => {
    expect(decode(array(integer), [1, 2, 3])).toEqual([1, 2, 3]);
  });
  test("rejects non-array", () => {
    expect(() => decode(array(string), "x")).toThrow(DecodeError);
    expect(() => decode(array(string), { length: 0 })).toThrow(DecodeError);
  });
  test("reports failing element with index path", () => {
    const r = safeDecode(array(string), ["a", 2, "c"]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.path).toEqual(["1"]);
      expect(r.error.expected).toBe("string");
    }
  });
  test("rejects null", () => {
    expect(() => decode(array(string), null)).toThrow(DecodeError);
  });
});

describe("record_decodes_string_keyed_map", () => {
  test("decodes empty record", () => {
    expect(decode(record(string), {})).toEqual({});
  });
  test("decodes record of strings", () => {
    expect(decode(record(string), { a: "x", b: "y" })).toEqual({ a: "x", b: "y" });
  });
  test("rejects non-object inputs", () => {
    expect(() => decode(record(string), [])).toThrow(DecodeError);
    expect(() => decode(record(string), null)).toThrow(DecodeError);
    expect(() => decode(record(string), 1)).toThrow(DecodeError);
  });
  test("reports failing key with path segment", () => {
    const r = safeDecode(record(integer), { a: 1, b: "nope" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.path).toEqual(["b"]);
      expect(r.error.expected).toBe("integer");
    }
  });
});
