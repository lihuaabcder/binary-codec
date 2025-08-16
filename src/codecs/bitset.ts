import type { Codec, MetaField } from '../types';
import type { NumberField } from './number';

export type BitsetField = MetaField<'bitset'>;

export const bitsetCodec: Codec<BitsetField, boolean[]> = {
  type: 'bitset',
  read: (view, spec, ctx) => {
    const { byteOffset, byteLength } = spec;
    const result: boolean[] = [];
    const total = byteLength * 8;

    for (let i = 0; i < total; i++) {
      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      const byte = ctx.get<NumberField, number>('number').read(
        view,
        {
          numberType: 'uint',
          byteOffset: byteOffset + byteIndex,
          byteLength: 1
        },
        ctx
      );
      const bit = (byte >> bitIndex) & 1;
      result.push(Boolean(bit));
    }

    return result;
  },
  write: (view, spec, value, ctx) => {
    const { byteOffset, byteLength } = spec;

    const totalBits = byteLength * 8;

    // set all bits to 0
    for (let i = 0; i < byteLength; i++) {
      ctx.get<NumberField, number>('number').write!(
        view,
        {
          numberType: 'uint',
          byteOffset: byteOffset + i,
          byteLength: 1
        },
        0,
        ctx
      );
    }

    for (let i = 0; i < totalBits; i++) {
      if (!value[i]) {
        continue;
      }

      const byteIndex = Math.floor(i / 8);
      const bitIndex = i % 8;
      const pre = ctx.get<NumberField, number>('number').read(
        view,
        {
          numberType: 'uint',
          byteOffset: byteOffset + byteIndex,
          byteLength: 1
        },
        ctx
      );

      ctx.get<NumberField, number>('number').write!(
        view,
        {
          numberType: 'uint',
          byteOffset: byteOffset + byteIndex,
          byteLength: 1
        },
        pre | (1 << bitIndex),
        ctx
      );
    }
  }
};
