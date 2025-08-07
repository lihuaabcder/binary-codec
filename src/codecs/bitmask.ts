import type { Codec, MetaField } from '../types';
import type { NumberByteLength } from './number';
import { extractBits } from '../utils/bitUtils';
import { numberCodec } from './number';

export type BitmaskField = MetaField<'bitmask'> & {
  byteLength: NumberByteLength
  map: BitmaskMap
};

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

export const bitmaskCodec: Codec<BitmaskField, Record<string, any>> = {
  type: 'bitmask',
  read: (view, spec) => {
    const { byteOffset, byteLength, littleEndian, map } = spec;
    const bitmaskValue = numberCodec.read(
      view,
      {
        type: 'number',
        numberType: 'uint',
        byteOffset,
        byteLength,
        littleEndian
      }
    );
    return extractBitFields(bitmaskValue, map);
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
