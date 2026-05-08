import { DecodeError, describe as describeValue } from "../src/errors";

describe("describe_renders_value_compactly", () => {
  test("null and undefined", () => {
    expect(describeValue(null)).toBe("null");
    expect(describeValue(undefined)).toBe("undefined");
  });
  test("primitives", () => {
    expect(describeValue("ab")).toBe('"ab"');
    expect(describeValue(7)).toBe("7");
    expect(describeValue(true)).toBe("true");
    expect(describeValue(BigInt(1))).toBe("1");
  });
  test("array shows length", () => {
    expect(describeValue([1, 2, 3])).toBe("array(3)");
  });
  test("object shows tag", () => {
    expect(describeValue({ a: 1 })).toBe("object");
  });
  test("symbol shows tag", () => {
    expect(describeValue(Symbol("x"))).toBe("symbol");
  });
  test("function shows tag", () => {
    expect(describeValue(() => 1)).toBe("function");
  });
});

describe("DecodeError_construction_and_path", () => {
  test("pathString uses <root> for empty path", () => {
    const e = new DecodeError({ path: [], expected: "x", actual: 1 });
    expect(e.pathString()).toBe("<root>");
    expect(e.message).toContain("<root>");
  });
  test("pathString joins by '.'", () => {
    const e = new DecodeError({ path: ["a", "0", "b"], expected: "x", actual: 1 });
    expect(e.pathString()).toBe("a.0.b");
    expect(e.message).toContain("a.0.b");
  });
  test("preserves branches when provided", () => {
    const inner = new DecodeError({ path: ["a"], expected: "string", actual: 1 });
    const e = new DecodeError({
      path: [], expected: "union", actual: 1, branches: [inner],
    });
    expect(e.branches).toEqual([inner]);
  });
  test("name is DecodeError", () => {
    const e = new DecodeError({ path: [], expected: "x", actual: 1 });
    expect(e.name).toBe("DecodeError");
  });
});
