import { Decoder, DecodeContext, DecodeResult, fail, makeDecoder, ok } from "./decoder";

/**
 * Decoder accepting any string. Use {@link refinePattern} or other
 * refinements to narrow further.
 */
export const string: Decoder<string> = makeDecoder<string>(
  (input: unknown, ctx: DecodeContext): DecodeResult<string> => {
    if (typeof input !== "string") {
      return fail({ path: ctx.path, expected: "string", actual: input });
    }
    return ok(input);
  },
);

/**
 * Decoder accepting any finite number. Rejects `NaN`, `Infinity`, and
 * `-Infinity` to match the JSON specification.
 */
export const number: Decoder<number> = makeDecoder<number>(
  (input: unknown, ctx: DecodeContext): DecodeResult<number> => {
    if (typeof input !== "number" || !Number.isFinite(input)) {
      return fail({ path: ctx.path, expected: "finite number", actual: input });
    }
    return ok(input);
  },
);

/**
 * Decoder accepting any safe integer (`Number.isSafeInteger`). Rejects
 * non-integer numbers, NaN, Infinity, and values outside the safe-int
 * range.
 */
export const integer: Decoder<number> = makeDecoder<number>(
  (input: unknown, ctx: DecodeContext): DecodeResult<number> => {
    if (typeof input !== "number" || !Number.isSafeInteger(input)) {
      return fail({ path: ctx.path, expected: "integer", actual: input });
    }
    return ok(input);
  },
);

/** Decoder accepting `true` and `false`. */
export const boolean: Decoder<boolean> = makeDecoder<boolean>(
  (input: unknown, ctx: DecodeContext): DecodeResult<boolean> => {
    if (typeof input !== "boolean") {
      return fail({ path: ctx.path, expected: "boolean", actual: input });
    }
    return ok(input);
  },
);

/** Decoder accepting only the `null` literal. */
export const null_: Decoder<null> = makeDecoder<null>(
  (input: unknown, ctx: DecodeContext): DecodeResult<null> => {
    if (input !== null) {
      return fail({ path: ctx.path, expected: "null", actual: input });
    }
    return ok(null);
  },
);

/** Decoder that always succeeds, preserving the value as `unknown`. */
export const unknown_: Decoder<unknown> = makeDecoder<unknown>(
  (input: unknown): DecodeResult<unknown> => ok(input),
);
