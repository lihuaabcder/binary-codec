import type { Codec, MetaField } from '../types.ts';
import type { NumberField } from './number.ts';
import { ValidationLevel } from '../validation/types.ts';

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
  },
  validate: (spec, path, _ctx) => {
    const results = [];
    const { byteLength } = spec;

    if (byteLength <= 0) {
      results.push({
        level: ValidationLevel.FATAL,
        message: 'Bitset field byteLength must be positive',
        path: `${path}.byteLength`,
        code: 'INVALID_BITSET_LENGTH'
      });
    }

    return results;
  },
  validateData: (spec, data, path, _ctx) => {
    const results = [];

    if (!Array.isArray(data)) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Expected array for bitset field, got ${typeof data}`,
        path,
        code: 'INVALID_BITSET_DATA_TYPE'
      });
      return results;
    }

    const { byteLength } = spec;
    const expectedLength = byteLength * 8;

    if (data.length !== expectedLength) {
      results.push({
        level: ValidationLevel.ERROR,
        message: `Bitset length mismatch: expected ${expectedLength}, got ${data.length}`,
        path,
        code: 'BITSET_LENGTH_MISMATCH'
      });
    }

    // Check that all elements are boolean
    data.forEach((value, index) => {
      if (typeof value !== 'boolean') {
        results.push({
          level: ValidationLevel.ERROR,
          message: `Expected boolean at index ${index}, got ${typeof value}`,
          path: `${path}[${index}]`,
          code: 'INVALID_BITSET_ELEMENT_TYPE'
        });
      }
    });

    return results;
  }
};
