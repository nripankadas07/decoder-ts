import { DecodeError } from "./errors";
import {
  Decoder,
  descend,
  fail,
  makeDecoder,
  ok,
} from "./decoder";

/**
 * Object schema mapping each property key to a decoder for its value.
 */
export type Shape = { readonly [K in string]: Decoder<unknown> };

/** Infer the runtime type of a shape's decoded object. */
export type ShapeOutput<S extends Shape> = {
  [K in keyof S]: S[K] extends Decoder<infer V> ? V : never;
};

/** Tuple of decoders, used by the `tuple` combinator. */
export type DecoderTuple = ReadonlyArray<Decoder<unknown>>;

/** Infer the runtime type of a tuple decoder. */
export type TupleOutput<T extends DecoderTuple> = {
  [I in keyof T]: T[I] extends Decoder<infer V> ? V : never;
};

/**
 * Decode an array whose every element matches `item`. Path traversal
 * uses the numeric index (e.g. `"0"`, `"1"`) for diagnostics.
 */
export function array<T>(item: Decoder<T>): Decoder<T[]> {
  return makeDecoder<T[]>((input, ctx) => {
    if (!Array.isArray(input)) {
      return fail({ path: ctx.path, expected: "array", actual: input });
    }
    const output: T[] = [];
    for (let i = 0; i < input.length; i++) {
      const result = item.run(input[i], descend(ctx, String(i)));
      if (!result.ok) return result;
      output.push(result.value);
    }
    return ok(output);
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Decode an object whose properties are described by `shape`. Extra
 * properties not present in `shape` are ignored — use
 * {@link objectStrict} to reject them.
 */
export function object<S extends Shape>(shape: S): Decoder<ShapeOutput<S>> {
  return makeDecoder<ShapeOutput<S>>((input, ctx) => {
    if (!isPlainObject(input)) {
      return fail({ path: ctx.path, expected: "object", actual: input });
    }
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      const decoder = shape[key];
      const result = decoder.run(input[key], descend(ctx, key));
      if (!result.ok) return result;
      output[key] = result.value;
    }
    return ok(output as ShapeOutput<S>);
  });
}

/**
 * Like {@link object} but rejects any property in the input that is
 * not declared in the shape. Use this when you want strict schemas.
 */
export function objectStrict<S extends Shape>(shape: S): Decoder<ShapeOutput<S>> {
  return makeDecoder<ShapeOutput<S>>((input, ctx) => {
    if (!isPlainObject(input)) {
      return fail({ path: ctx.path, expected: "object", actual: input });
    }
    const allowed = new Set(Object.keys(shape));
    for (const key of Object.keys(input)) {
      if (!allowed.has(key)) {
        return fail({
          path: descend(ctx, key).path,
          expected: "no extra property",
          actual: input[key],
        });
      }
    }
    const inner = object(shape);
    return inner.run(input, ctx);
  });
}

/**
 * Decode an object whose keys are unconstrained but whose values all
 * match `valueDecoder`. The output is a plain string-keyed record.
 */
export function record<V>(valueDecoder: Decoder<V>): Decoder<Record<string, V>> {
  return makeDecoder<Record<string, V>>((input, ctx) => {
    if (!isPlainObject(input)) {
      return fail({ path: ctx.path, expected: "object", actual: input });
    }
    const output: Record<string, V> = {};
    for (const key of Object.keys(input)) {
      const result = valueDecoder.run(input[key], descend(ctx, key));
      if (!result.ok) return result;
      output[key] = result.value;
    }
    return ok(output);
  });
}

/**
 * Decode a fixed-length tuple. The output array has length equal to
 * the number of decoders, with each element typed as the matching
 * decoder's output.
 */
export function tuple<T extends DecoderTuple>(...items: T): Decoder<TupleOutput<T>> {
  return makeDecoder<TupleOutput<T>>((input, ctx) => {
    if (!Array.isArray(input)) {
      return fail({ path: ctx.path, expected: "tuple", actual: input });
    }
    if (input.length !== items.length) {
      return fail({
        path: ctx.path,
        expected: `tuple of length ${items.length}`,
        actual: input,
      });
    }
    const output: unknown[] = [];
    for (let i = 0; i < items.length; i++) {
      const result = items[i]!.run(input[i], descend(ctx, String(i)));
      if (!result.ok) return result;
      output.push(result.value);
    }
    return ok(output as TupleOutput<T>);
  });
}

/**
 * Wrap a decoder so that `undefined` is accepted as a successful
 * decode of `undefined`. Useful for optional object properties.
 */
export function optional<T>(decoder: Decoder<T>): Decoder<T | undefined> {
  return makeDecoder<T | undefined>((input, ctx) => {
    if (input === undefined) return ok(undefined);
    return decoder.run(input, ctx);
  });
}

/**
 * Wrap a decoder so that `null` is accepted as a successful decode of
 * `null`. Distinct from {@link optional}, which accepts `undefined`.
 */
export function nullable<T>(decoder: Decoder<T>): Decoder<T | null> {
  return makeDecoder<T | null>((input, ctx) => {
    if (input === null) return ok(null);
    return decoder.run(input, ctx);
  });
}

/** Helper to compute the union of an array of decoder output types. */
type UnionOutput<T extends DecoderTuple> = {
  [I in keyof T]: T[I] extends Decoder<infer V> ? V : never;
}[number];

/**
 * Decode a value that matches at least one of `decoders`. Decoders are
 * tried in order; the first success wins. If all fail, a single
 * {@link DecodeError} is returned with the per-branch errors attached.
 */
export function union<T extends DecoderTuple>(...decoders: T): Decoder<UnionOutput<T>> {
  if (decoders.length === 0) {
    throw new Error("union: at least one decoder is required");
  }
  return makeDecoder<UnionOutput<T>>((input, ctx) => {
    const errors: DecodeError[] = [];
    for (const d of decoders) {
      const result = d.run(input, ctx);
      if (result.ok) return ok(result.value as UnionOutput<T>);
      errors.push(result.error);
    }
    return fail({
      path: ctx.path,
      expected: `one of ${decoders.length} branches`,
      actual: input,
      branches: errors,
    });
  });
}

/**
 * Decode a value equal (via `Object.is`) to one of the given literal
 * values. Use this for tagged unions and string enums.
 */
export function oneOf<T extends ReadonlyArray<string | number | boolean | null>>(
  ...values: T
): Decoder<T[number]> {
  if (values.length === 0) {
    throw new Error("oneOf: at least one value is required");
  }
  const set = new Set<unknown>(values);
  return makeDecoder<T[number]>((input, ctx) => {
    if (!set.has(input)) {
      return fail({
        path: ctx.path,
        expected: `one of ${values.map((v) => JSON.stringify(v)).join(", ")}`,
        actual: input,
      });
    }
    return ok(input as T[number]);
  });
}

/**
 * Transform the output of a decoder via a pure function. Use this when
 * you want to reshape a successfully decoded value (e.g. `Date.parse`
 * on a string).
 */
export function map<A, B>(decoder: Decoder<A>, f: (value: A) => B): Decoder<B> {
  return makeDecoder<B>((input, ctx) => {
    const result = decoder.run(input, ctx);
    if (!result.ok) return result;
    return ok(f(result.value));
  });
}

/**
 * Transform the output of a decoder using a function that itself
 * returns a decoder. Use this for context-dependent decoding (the
 * second decoder is chosen based on the first decoder's output).
 */
export function chain<A, B>(
  decoder: Decoder<A>,
  next: (value: A) => Decoder<B>,
): Decoder<B> {
  return makeDecoder<B>((input, ctx) => {
    const result = decoder.run(input, ctx);
    if (!result.ok) return result;
    return next(result.value).run(input, ctx);
  });
}

/**
 * Construct a decoder lazily. Use this to build recursive or
 * mutually-recursive decoders (e.g. trees, ASTs). The thunk is invoked
 * each time the decoder runs, so referenced decoders may be defined
 * after `lazy(...)`.
 */
export function lazy<T>(thunk: () => Decoder<T>): Decoder<T> {
  return makeDecoder<T>((input, ctx) => thunk().run(input, ctx));
}
