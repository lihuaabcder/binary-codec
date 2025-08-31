import type { ArrayField, ArrayItemField } from './codecs/array';
import type { BitmaskField, BooleanBitField, EnumBitField, UintBitField } from './codecs/bitmask';
import type { BitsetField } from './codecs/bitset';
import type { NumberField } from './codecs/number';
import type { ObjectField } from './codecs/object';
import type { RawField } from './codecs/raw';
import type { StringField } from './codecs/string';
import type { ValidationResult } from './validation/types';

export type MetaField<T extends string> = {
  name: string
  type: T
  byteOffset: number
  byteLength: number
  littleEndian?: boolean
};

export type Field
  = | RawField
    | NumberField
    | StringField
    | BitmaskField
    | BitsetField
    | ArrayField
    | ObjectField;

export type SpecFields = {
  fields: Field[]
};

export type CodecSpec = SpecFields & {
  byteLength: number
  littleEndian?: boolean
};

export type Resolver = {
  get: <S extends MetaField<any> = any, V = any>(type: string) => Codec<S, V>
};

export type Codec<S extends MetaField<any>, V> = {
  type: S['type']
  read: (view: DataView, spec: Omit<S, 'name' | 'type'>, ctx: Resolver) => V
  write?: (view: DataView, spec: Omit<S, 'name' | 'type'>, value: V, ctx: Resolver) => void
  validate?: (spec: S, path: string, ctx: Resolver) => ValidationResult[]
  validateData?: (spec: S, data: unknown, path: string, ctx: Resolver) => ValidationResult[]
};

type BaseTypeMap = {
  raw: Uint8Array
  number: number
  string: string
  bitset: boolean[]
};

export type DeepUnReadonly<T> = keyof T extends never
  ? T
  : T extends Uint8Array ? T
    : { -readonly [k in keyof T]: DeepUnReadonly<T[k]> };

export type Infer<T> = DeepUnReadonly<_Infer<T>>;

type _Infer<T>
  // Object type
  = T extends { fields: Field[] } ? InferObject<T>
  // Bitmask type
    : T extends BitmaskField ? InferBitMask<T>
    // Array type
      : T extends ArrayField ? InferArray<T>
      // Base type
        : T extends { type: infer K extends keyof BaseTypeMap } ? BaseTypeMap[K]
          : never;

export type InferObject<T extends { fields: Field[] }> = {
  [F in T['fields'][number] as F['name']]: _Infer<F>
};

export type InferBitMask<T extends Omit<BitmaskField, 'name' | 'byteOffset'>>
  = T['map'] extends infer M
    ? { [K in keyof M]:
      M[K] extends BooleanBitField ? boolean
        : M[K] extends UintBitField ? number
          : M[K] extends EnumBitField ? M[K]['values'][number]
            : never
    }
    : never;

export type InferArray<T extends ArrayField>
  = T['item'] extends infer I extends ArrayItemField
    ? I extends { type: keyof BaseTypeMap } ? BaseTypeMap[I['type']][]
      : I extends Omit<BitmaskField, 'name' | 'byteOffset'> ? InferBitMask<I>[] : never
    : never;
