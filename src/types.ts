import type { ArrayField } from './codecs/array';
import type { BitmaskField } from './codecs/bitmask';
import type { NumberField } from './codecs/number';
import type { RawField } from './codecs/raw';
import type { StringField } from './codecs/string';

export type MetaField = {
  type: string
  byteOffset: number
  byteLength: number
  littleEndian?: boolean
};

export type Field =
  | RawField
  | NumberField
  | StringField
  | BitmaskField
  | ArrayField;

export type CodecSpec = {
  byteLength: number
  fields: Field[]
};

export type Codec<S extends MetaField, V> = {
  type: S['type']
  read: (view: DataView, spec: S) => V
  write?: (view: DataView, value: V, spec: S) => void
  _output?: V
};
