import type { ArrayItemField, Field } from '../types';
import { readField } from './readField';

export function readArray(
  view: DataView,
  byteOffset: number,
  byteLength: number,
  item: ArrayItemField
) {
  const result: unknown[] = [];

  const { byteLength: itemByteLength } = item;

  const length = byteLength / itemByteLength;

  for (let i = 0; i < length; i++) {
    const itemByteOffset = byteOffset + i * itemByteLength;
    result.push(
      readField(
        view,
        {
          ...item,
          byteOffset: itemByteOffset
        } as Field
      )
    );
  }

  return result;
}
