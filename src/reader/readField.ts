import type { Field } from '../types';
import { readArray } from './readArray';
import { readBitmask } from './readBitmask';
import { readNumber } from './readNumber';
import { readRaw } from './readRaw';
import { readString } from './readString';

export function readField(
  view: DataView,
  schema: Field
) {
  const { type, byteLength, byteOffset, littleEndian = false } = schema;

  switch (type) {
    case 'int':
    case 'uint':
    case 'float':
      return readNumber(view, type, byteOffset, byteLength, littleEndian);
    case 'string':
      return readString(view, byteOffset, byteLength);
    case 'bitmask':
      return readBitmask(view, byteOffset, byteLength, schema.map, littleEndian);
    case 'array':
      return readArray(view, byteOffset, byteLength, schema.item);
    case 'raw':
    default:
      return readRaw(view, byteOffset, byteLength);
  }
}
