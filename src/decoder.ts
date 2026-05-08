import { DecodeError } from "./errors";

/**
 * Context threaded through every decoder call. Carries the path from
 * the root of the input down to the value currently being decoded.
 * Decoders extend the path before recursing into nested values.
 */
export interface DecodeContext {
  readonly path: ReadonlyArray<string>;
}

/** Successful decode result. */
export interface DecodeSuccess<T> {
  readonly ok: true;
  readonly value: T;
}

/** Failed decode result. */
export interface DecodeFailure {
  readonly ok: false;
  readonly error: DecodeError;
}

/** Discriminated union returned by `safeDecode` and internal decoders. */
export type DecodeResult<T> = DecodeSuccess<T> | DecodeFailure;

/**
 * Core decoder shape. `run` is the only required method; the other
 * helpers (`map`, `chain`, `andThen`, `withRefinement`) are convenience
 * wrappers exposed via the {@link makeDecoder} factory so every
 * combinator returns the same enriched object.
 */
export interface Decoder<T> {
  /** Internal entrypoint — runs the decoder against an unknown input. */
  readonly run: (input: unknown, ctx: DecodeContext) => DecodeResult<T>;
}

/**
 * Build a `Decoder<T>` from its `run` function. This is the only place
 * the `Decoder` value is constructed.
 */
export function makeDecoder<T>(
  run: (input: unknown, ctx: DecodeContext) => DecodeResult<T>,
): Decoder<T> {
  return { run };
}

/** Helper for decoder authors to produce a successful result. */
export function ok<T>(value: T): DecodeSuccess<T> {
  return { ok: true, value };
}

/** Helper for decoder authors to produce a failure result. */
export function fail(args: {
  path: ReadonlyArray<string>;
  expected: string;
  actual: unknown;
  branches?: ReadonlyArray<DecodeError>;
}): DecodeFailure {
  return { ok: false, error: new DecodeError(args) };
}

/**
 * Run a decoder against unknown input and return the parsed value, or
 * throw a {@link DecodeError} on failure. Use this when you want
 * throwing semantics; prefer {@link safeDecode} when you want to
 * branch on the result.
 */
export function decode<T>(decoder: Decoder<T>, input: unknown): T {
  const result = decoder.run(input, { path: [] });
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

/**
 * Run a decoder against unknown input and return a `DecodeResult<T>`
 * describing success or failure. This never throws on validation
 * failures (programmer errors inside custom decoders may still throw).
 */
export function safeDecode<T>(decoder: Decoder<T>, input: unknown): DecodeResult<T> {
  return decoder.run(input, { path: [] });
}

/**
 * Extend the path with one segment, used by container combinators
 * (array, object, record, tuple) to track location during traversal.
 */
export function descend(ctx: DecodeContext, segment: string): DecodeContext {
  return { path: [...ctx.path, segment] };
}
