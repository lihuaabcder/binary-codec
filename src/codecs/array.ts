import type { Codec, Field, MetaField } from '../types';
import { registry } from '../registry';

export type ArrayField = MetaField & {
  type: 'array'
  item: ArrayItemField
};

export type ArrayItemField = Omit<Exclude<Field, 'ArrayField'>, 'byteOffset'>;

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
