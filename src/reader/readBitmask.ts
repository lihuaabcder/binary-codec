import type { BitmaskMap, BitPosition, BitRange } from '../types';
import { extractBits } from '../utils/bitUtils';
import { readNumber } from './readNumber';

export function readBitmask(
  view: DataView,
  byteOffset: number,
  byteLength: number,
  map: BitmaskMap,
  littleEndian = false
) {
  const bitmaskValue = readNumber(view, 'uint', byteOffset, byteLength, littleEndian);
  return extractBitFields(bitmaskValue, map);
}

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

  return (value >> bits) & 1;
}
