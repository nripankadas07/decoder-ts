/**
 * decoder-ts — type-safe runtime JSON validators built from
 * composable decoder combinators.
 *
 * @example Basic decoding
 * ```ts
 * import { decode, object, string, integer, array } from "decoder-ts";
 *
 * type Repo = { name: string; stars: number; topics: string[] };
 * const repo = object({
 *   name: string,
 *   stars: integer,
 *   topics: array(string),
 * });
 *
 * const value: Repo = decode(repo, JSON.parse(jsonText));
 * ```
 */

export { DecodeError, describe } from "./errors";
export {
  Decoder,
  DecodeContext,
  DecodeResult,
  DecodeSuccess,
  DecodeFailure,
  decode,
  safeDecode,
  makeDecoder,
  ok,
  fail,
  descend,
} from "./decoder";
export {
  string,
  number,
  integer,
  boolean,
  null_,
  unknown_,
} from "./primitives";
export {
  Shape,
  ShapeOutput,
  DecoderTuple,
  TupleOutput,
  array,
  object,
  objectStrict,
  record,
  tuple,
  optional,
  nullable,
  union,
  oneOf,
  map,
  chain,
  lazy,
} from "./combinators";
export {
  refine,
  min,
  max,
  length,
  pattern,
  nonEmpty,
  int,
} from "./refinements";
