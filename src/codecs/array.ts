import type { Codec, Field, MetaField } from '../types';
import { registry } from '../registry';

export type ArrayField = MetaField<'array'> & {
  item: ArrayItemField
};

export type NonArrayField = Exclude<Field, ArrayField>;

export type ArrayItemField =
  NonArrayField extends infer U
    ? U extends any
      ? Omit<U, 'name'>
      : never
    : never;

export const arrayCodec: Codec<ArrayField, unknown[]> = {
  type: 'array',
  read: (view, spec) => {
    const { byteOffset, byteLength, item } = spec;

    const result: unknown[] = [];

    const { byteLength: itemByteLength } = item;

    const length = byteLength / itemByteLength;

    for (let i = 0; i < length; i++) {
      const itemByteOffset = byteOffset + i * itemByteLength;
      const codec = registry.get(item.type);
      result.push(codec.read(view, {
        ...item,
        byteOffset: itemByteOffset
      }));
    }

    return result;
  }
};
