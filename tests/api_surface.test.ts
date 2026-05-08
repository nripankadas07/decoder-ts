import * as api from "../src";

describe("api_surface", () => {
  test("entrypoints are exported", () => {
    expect(typeof api.decode).toBe("function");
    expect(typeof api.safeDecode).toBe("function");
    expect(typeof api.makeDecoder).toBe("function");
    expect(typeof api.ok).toBe("function");
    expect(typeof api.fail).toBe("function");
    expect(typeof api.descend).toBe("function");
    expect(typeof api.describe).toBe("function");
  });

  test("primitives are exported", () => {
    for (const name of ["string", "number", "integer", "boolean", "null_", "unknown_"]) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe("object");
    }
  });

  test("combinators are exported", () => {
    for (const name of [
      "array", "object", "objectStrict", "record", "tuple",
      "optional", "nullable", "union", "oneOf", "map", "chain", "lazy",
    ]) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
    }
  });

  test("refinements are exported", () => {
    for (const name of ["refine", "min", "max", "length", "pattern", "nonEmpty", "int"]) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
    }
  });

  test("DecodeError is exported and constructible", () => {
    const err = new api.DecodeError({
      path: ["a", "b"],
      expected: "string",
      actual: 1,
    });
    expect(err).toBeInstanceOf(api.DecodeError);
    expect(err).toBeInstanceOf(Error);
    expect(err.path).toEqual(["a", "b"]);
    expect(err.expected).toBe("string");
    expect(err.actual).toBe(1);
    expect(err.pathString()).toBe("a.b");
    expect(err.message).toContain("a.b");
  });
});
