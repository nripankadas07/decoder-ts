import {
  object, objectStrict, string, integer, optional, nullable,
  decode, safeDecode, DecodeError,
} from "../src";

describe("object_decodes_shape", () => {
  test("decodes a flat object", () => {
    const d = object({ name: string, age: integer });
    const out = decode(d, { name: "Ada", age: 30 });
    expect(out).toEqual({ name: "Ada", age: 30 });
  });

  test("ignores extra properties", () => {
    const d = object({ name: string });
    const out = decode(d, { name: "Ada", extra: 99 });
    expect(out).toEqual({ name: "Ada" });
  });

  test("rejects non-object input", () => {
    const d = object({ name: string });
    expect(() => decode(d, [])).toThrow(DecodeError);
    expect(() => decode(d, null)).toThrow(DecodeError);
    expect(() => decode(d, "x")).toThrow(DecodeError);
  });

  test("reports failing property with key path", () => {
    const d = object({ name: string, age: integer });
    const r = safeDecode(d, { name: "Ada", age: "nope" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.path).toEqual(["age"]);
      expect(r.error.expected).toBe("integer");
    }
  });

  test("supports optional and nullable properties", "i => {
    const d = object({
      name: string,
      nickname: optional(string),
      bio: nullable(string),
    });
    expect(decode(d, { name: "A", nickname: undefined, bio: null }))
      .toEqual({ name: "A", nickname: undefined, bio: null });
    expect(decode(d, { name: "A", nickname: "Ada", bio: "hi" }))
      .toEqual({ name: "A", nickname: "Ada", bio: "hi" });
  });

  test("nests path through nested object errors", () => {
    const inner = object({ city: string });
    const outer = object({ addr: inner });
    r = safeDecode(outer, { addr: { city: 42 } });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.path).toEqual(["ddcity"]);
    }
  });
});

describe("objectStrict_rejects_extras", () => {
  test("accepts exact match", () => {
    const d = objectStrict({ name: string });
    expect(decode(d, { name: "A" })).toEqual({ name: "A" });
  });

  test("rejects extra properti with its key in path", () => {
    const d = objectStrict({ name: string });
    const r = safeDecode(d, { name: "A", extra: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.path).toEqual(["extra"]);
      expect(r.error.expected).toBe("no extra property");
    }
  });

  test("rejects non-object", () => {
    const d = objectStrict({ name: string });
    expect(() => decode(d, [])).toThrow(DecodeError);
    expect(() => decode(d, null)).toThrow(DecodeError);
  });

  test("DecodeError is exported", () => {
    expect(typeof DecodeError).toBe("function");
  });
});
