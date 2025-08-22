import type { Codec, MetaField } from '../types.ts';
import type { NumberByteLength, NumberField } from './number.ts';
import { extractBits } from '../utils/bitUtils.ts';
import { ValidationLevel } from '../validation/types.ts';

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
  },
  validate: (spec, path, _ctx) => {
    const results = [];
    const maxBits = spec.byteLength * 8;

    for (const [mapKey, bitField] of Object.entries(spec.map)) {
      const bitFieldPath = `${path}.map.${mapKey}`;

      if (Array.isArray(bitField.bits)) {
        const [high, low] = bitField.bits;

        if (high >= maxBits || low >= maxBits) {
          results.push({
            level: ValidationLevel.FATAL,
            message: `Bit position ${Math.max(high, low)} exceeds field size (${maxBits} bits)`,
            path: bitFieldPath,
            code: 'BIT_OUT_OF_RANGE'
          });
        }

        if (high < low) {
          results.push({
            level: ValidationLevel.ERROR,
            message: `Bit range [${high}, ${low}] has high < low`,
            path: bitFieldPath,
            code: 'INVALID_BIT_RANGE'
          });
        }

        if (bitField.type === 'enum') {
          const bitWidth = high - low + 1;
          const maxValues = 1 << bitWidth;
          if (bitField.values.length > maxValues) {
            results.push({
              level: ValidationLevel.ERROR,
              message: `Too many enum values (${bitField.values.length}) for ${bitWidth} bits (max ${maxValues})`,
              path: bitFieldPath,
              code: 'TOO_MANY_ENUM_VALUES'
            });
          }
        }
      } else {
        // Single bit position
        if (typeof bitField.bits === 'number' && bitField.bits >= maxBits) {
          results.push({
            level: ValidationLevel.FATAL,
            message: `Bit position ${bitField.bits} exceeds field size (${maxBits} bits)`,
            path: bitFieldPath,
            code: 'BIT_OUT_OF_RANGE'
          });
        }
      }
    }

    return results;
  },
  validateData: (spec, data, path, _ctx) => {
    const results = [];

    if (typeof data !== 'object' || data === null) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Expected object for bitmask data, got ${typeof data}`,
        path,
        code: 'INVALID_BITMASK_DATA_TYPE'
      });
      return results;
    }

    const dataObj = data as Record<string, any>;

    for (const [mapKey, bitField] of Object.entries(spec.map)) {
      const fieldPath = `${path}.${mapKey}`;
      const value = dataObj[mapKey];

      if (value === undefined) {
        continue; // Optional fields are allowed
      }

      // Validate based on bit field type
      if (bitField.type === 'boolean') {
        if (typeof value !== 'boolean') {
          results.push({
            level: ValidationLevel.ERROR,
            message: `Expected boolean for field '${mapKey}', got ${typeof value}`,
            path: fieldPath,
            code: 'INVALID_BOOLEAN_FIELD'
          });
        }
      } else if (bitField.type === 'uint') {
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          results.push({
            level: ValidationLevel.ERROR,
            message: `Expected non-negative integer for field '${mapKey}', got ${value}`,
            path: fieldPath,
            code: 'INVALID_UINT_FIELD'
          });
        } else {
          // Check if value fits in the bit range
          const bits = bitField.bits;
          const bitWidth = Array.isArray(bits) ? bits[0] - bits[1] + 1 : 1;
          const maxValue = (1 << bitWidth) - 1;
          if (value > maxValue) {
            results.push({
              level: ValidationLevel.ERROR,
              message: `Value ${value} exceeds maximum ${maxValue} for ${bitWidth}-bit field '${mapKey}'`,
              path: fieldPath,
              code: 'VALUE_OUT_OF_RANGE'
            });
          }
        }
      } else if (bitField.type === 'enum') {
        if (typeof value !== 'string') {
          results.push({
            level: ValidationLevel.ERROR,
            message: `Expected string for enum field '${mapKey}', got ${typeof value}`,
            path: fieldPath,
            code: 'INVALID_ENUM_FIELD_TYPE'
          });
        } else if (!bitField.values.includes(value)) {
          results.push({
            level: ValidationLevel.ERROR,
            message: `Invalid enum value '${value}' for field '${mapKey}'. Valid values: ${bitField.values.join(', ')}`,
            path: fieldPath,
            code: 'INVALID_ENUM_VALUE'
          });
        }
      }
    }

    return results;
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
