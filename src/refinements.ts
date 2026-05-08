import { Decoder, fail, makeDecoder, ok } from "./decoder";

/**
 * Add a custom predicate to a decoder. The predicate is invoked with
 * the value already produced by the inner decoder; if it returns
 * `false`, the decoder fails with the supplied `expected` message.
 */
export function refine<T>(
  decoder: Decoder<T>,
  predicate: (value: T) => boolean,
  expected: string,
): Decoder<T> {
  return makeDecoder<T>((input, ctx) => {
    const result = decoder.run(input, ctx);
    if (!result.ok) return result;
    if (!predicate(result.value)) {
      return fail({ path: ctx.path, expected, actual: result.value });
    }
    return ok(result.value);
  });
}

/** Constrain a number decoder to values `>= min`. */
export function min(decoder: Decoder<number>, threshold: number): Decoder<number> {
  return refine(decoder, (n) => n >= threshold, `number >= ${threshold}`);
}

/** Constrain a number decoder to values `<= max`. */
export function max(decoder: Decoder<number>, threshold: number): Decoder<number> {
  return refine(decoder, (n) => n <= threshold, `number <= ${threshold}`);
}

/**
 * Constrain a string or array decoder to a length range. Inclusive on
 * both bounds. Pass `Infinity` (or omit the bound) for an open range.
 */
export function length<T extends string | ReadonlyArray<unknown>>(
  decoder: Decoder<T>,
  bounds: { min?: number; max?: number },
): Decoder<T> {
  const lo = bounds.min ?? 0;
  const hi = bounds.max ?? Infinity;
  if (lo < 0 || hi < lo) {
    throw new Error("length: invalid bounds");
  }
  return refine(
    decoder,
    (value) => value.length >= lo && value.length <= hi,
    `length in [${lo}, ${hi === Infinity ? "inf" : hi}]`,
  );
}

/** Constrain a string decoder to values matching the given pattern. */
export function pattern(decoder: Decoder<string>, regex: RegExp): Decoder<string> {
  return refine(decoder, (s) => regex.test(s), `string matching ${regex}`);
}

/**
 * Refine a string or array decoder to non-empty values. Equivalent to
 * `length(d, { min: 1 })` but more readable at call sites.
 */
export function nonEmpty<T extends string | ReadonlyArray<unknown>>(
  decoder: Decoder<T>,
): Decoder<T> {
  return refine(decoder, (value) => value.length > 0, "non-empty");
}

/**
 * Refine a number decoder to integers. Useful when you have applied
 * `min`/`max` to `number` and want an integer constraint on top.
 */
export function int(decoder: Decoder<number>): Decoder<number> {
  return refine(decoder, (n) => Number.isInteger(n), "integer");
}
