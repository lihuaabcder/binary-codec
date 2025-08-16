import type { Codec, MetaField } from '../types';
import type { NumberByteLength, NumberField } from './number';
import { extractBits } from '../utils/bitUtils';

export type BitmaskField = MetaField<'bitmask'> & {
  byteLength: NumberByteLength
  map: BitmaskMap
};

export type BitmaskReturn = Record<string, boolean | number | string>;

export type BitmaskMap = Record<string, BitField>;

export type BitField = BooleanBitField | UintBitField | EnumBitField;

export type BitPosition = number;

export type BitRange = readonly [start: number, end: number];

export type BooleanBitField = {
  bits: BitPosition
  type: 'boolean'
};

export type UintBitField = {
  bits: BitPosition | BitRange
  type: 'uint'
};

export type EnumBitField = {
  bits: BitPosition | BitRange
  type: 'enum'
  values: string[]
};

export const bitmaskCodec: Codec<BitmaskField, BitmaskReturn> = {
  type: 'bitmask',
  read: (view, spec, ctx) => {
    const {
      byteOffset,
      byteLength,
      map,
      littleEndian = false
    } = spec;

    const bitmaskValue = ctx.get<NumberField, number>('number').read(
      view,
      {
        numberType: 'uint',
        byteOffset,
        byteLength,
        littleEndian
      },
      ctx
    );

    return extractBitFields(bitmaskValue, map);
  },
  write: (view, spec, value, ctx) => {
    const {
      byteOffset,
      byteLength,
      map,
      littleEndian = false
    } = spec;

    const combined = combineBitFields(value, map);

    ctx.get<NumberField, number>('number').write!(
      view,
      {
        byteOffset,
        byteLength,
        numberType: 'uint',
        littleEndian
      },
      combined,
      ctx
    );
  }
};

function extractBitFields(
  value: number,
  map: BitmaskMap
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, config] of Object.entries(map)) {
    const { bits, type } = config;

    const bitValue = extractBitValue(value, bits);

    if (type === 'boolean') {
      result[key] = Boolean(bitValue);
    } else if (type === 'enum') {
      const { values } = config;
      result[key] = values[bitValue];
    } else {
      result[key] = bitValue;
    }
  }

  return result;
}

function extractBitValue(
  value: number,
  bits: BitPosition | BitRange
): number {
  if (Array.isArray(bits)) {
    const [start, end] = bits;
    return extractBits(value, start, end);
  }

  return (value >> (bits as number)) & 1;
}

function combineBitFields(
  value: BitmaskReturn,
  map: BitmaskMap
) {
  return Object.entries(map).reduce<number>(
    (total, [key, bitField]) => {
      let numericVal = 0;
      const fieldValue = value[key];

      if (fieldValue === undefined) {
        return total;
      }

      const { bits, type } = bitField;
      if (type === 'uint') {
        numericVal = fieldValue as number;
      } else if (type === 'boolean') {
        numericVal = Number(fieldValue);
      } else if (type === 'enum') {
        const { values } = bitField;
        numericVal = values.indexOf(fieldValue as string);
      }

      const bitsRange = Array.isArray(bits) ? bits : [bits];
      const [high, low] = bitsRange.length === 1 ? [bitsRange[0], bitsRange[0]] : bitsRange;
      const bitWidth = high - low + 1;

      const maxAllowed = (1 << bitWidth) - 1;

      const safeValue = numericVal & maxAllowed;

      return total |= (safeValue << low);
    },
    0
  );
}
