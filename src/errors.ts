/**
 * DecodeError describes a single validation failure encountered while
 * decoding an unknown input. The {@link path} array records the
 * traversal chain from the root to the failure site (object keys and
 * array indices, e.g. `["users", "0", "email"]`). The {@link expected}
 * field describes what the decoder required, and {@link actual}
 * preserves the raw value that was rejected.
 */
export class DecodeError extends Error {
  /** Path from the root input to the failure site. */
  readonly path: ReadonlyArray<string>;
  /** Human-readable description of what was expected. */
  readonly expected: string;
  /** The value that was rejected (kept verbatim for diagnostics). */
  readonly actual: unknown;
  /** Branch errors when this was raised by a `union` decoder. */
  readonly branches?: ReadonlyArray<DecodeError>;

  constructor(args: {
    path: ReadonlyArray<string>;
    expected: string;
    actual: unknown;
    branches?: ReadonlyArray<DecodeError>;
  }) {
    super(buildMessage(args.path, args.expected, args.actual));
    this.name = "DecodeError";
    this.path = args.path;
    this.expected = args.expected;
    this.actual = args.actual;
    if (args.branches !== undefined) {
      this.branches = args.branches;
    }
    Object.setPrototypeOf(this, DecodeError.prototype);
  }

  /**
   * Render the path as a JSON-pointer-style string. The empty path is
   * rendered as `"<root>"`.
   */
  pathString(): string {
    return this.path.length === 0 ? "<root>" : this.path.join(".");
  }
}

function buildMessage(
  path: ReadonlyArray<string>,
  expected: string,
  actual: unknown,
): string {
  const where = path.length === 0 ? "<root>" : path.join(".");
  return `at ${where}: expected ${expected}, got ${describe(actual)}`;
}

/**
 * One-line debug rendering of a value. Strings are quoted; objects and
 * arrays show their tag rather than their contents to keep the message
 * short.
 */
export function describe(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "number" || t === "boolean" || t === "bigint") return String(value);
  if (Array.isArray(value)) return `array(${value.length})`;
  if (t === "object") return "object";
  return t;
}
