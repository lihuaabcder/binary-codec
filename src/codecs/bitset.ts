import type { Codec, MetaField } from '../types';

export type BitsetField = MetaField<'bitset'>;

export const bitsetCodec: Codec<BitsetField, boolean[]> = {
  type: 'bitset',
  read: (view, spec) => {
    const { byteOffset, byteLength } = spec;
    const result: boolean[] = [];
    const total = byteLength * 8;

    for (let i = 0; i < total; i++) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      const byte = view.getUint8(byteOffset + byteIndex);
      const bit = (byte >> bitIndex) & 1;
      result.push(Boolean(bit));
    }

    return result;
  }
};
