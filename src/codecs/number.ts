import type { Codec, MetaField } from '../types';
import { ValidationLevel } from '../validation/types';

export type NumberType = 'uint' | 'int' | 'float';

export type NumberByteLength = 1 | 2 | 4;

export type NumberField = Omit<MetaField<'number'>, 'byteLength'> & {
  numberType: NumberType
  byteLength: NumberByteLength
};

// TODO bigint..
const typeToDataViewMethod: Record<string, { get: keyof DataView, set: keyof DataView }> = {
  uint8: {
    get: 'getUint8',
    set: 'setUint8'
  },
  int8: {
    get: 'getInt8',
    set: 'setInt8'
  },
  uint16: {
    get: 'getUint16',
    set: 'setUint16'
  },
  int16: {
    get: 'getInt16',
    set: 'setInt16'
  },
  uint32: {
    get: 'getUint32',
    set: 'setUint32'
  },
  int32: {
    get: 'getInt32',
    set: 'setInt32'
  },
  float32: {
    get: 'getFloat32',
    set: 'setFloat32'
  }
  // float64: 'getFloat64'
};

export const numberCodec: Codec<NumberField, number> = {
  type: 'number',
  read: (view, spec) => {
    const {
      numberType,
      byteOffset,
      byteLength,
      littleEndian = false
    } = spec;

    const readerType = `${numberType}${byteLength * 8}`;

    const method = typeToDataViewMethod[readerType]['get'];

    if (!method) {
      throw new Error(`Unsupported number type: ${numberType}`);
    }

    const isSingleByte = byteLength === 1;

    const fn = view[method] as (...args: any[]) => number;

    return isSingleByte ? fn.call(view, byteOffset) : fn.call(view, byteOffset, littleEndian);
  },
  write: (view, spec, value) => {
    const {
      numberType,
      byteOffset,
      byteLength,
      littleEndian = false
    } = spec;

    const readerType = `${numberType}${byteLength * 8}`;

    const method = typeToDataViewMethod[readerType]['set'];

    if (!method) {
      throw new Error(`Unsupported number type: ${numberType}`);
    }

    const isSingleByte = byteLength === 1;

    const fn = view[method] as (off: number, val: number, le?: boolean) => void;

    isSingleByte ? fn.call(view, byteOffset, value) : fn.call(view, byteOffset, value, littleEndian);
  },
  validate: (spec, path, _ctx) => {
    const results = [];
    const { numberType, byteLength } = spec;

    // Validate number type and byte length combinations
    const validCombinations: Record<NumberType, NumberByteLength[]> = {
      uint: [1, 2, 4],
      int: [1, 2, 4],
      float: [4]
    };

    if (!validCombinations[numberType]?.includes(byteLength)) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Invalid combination: ${numberType} with ${byteLength} bytes`,
        path,
        code: 'INVALID_NUMBER_TYPE_LENGTH'
      });
    }

    return results;
  },
  validateData: (spec, data, path, _ctx) => {
    const results = [];

    if (typeof data !== 'number') {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Expected number for number field, got ${typeof data}`,
        path,
        code: 'INVALID_NUMBER_DATA_TYPE'
      });
      return results;
    }

    const { numberType, byteLength } = spec;

    // Validate based on number type
    if (numberType === 'uint') {
      if (!Number.isInteger(data) || data < 0) {
        results.push({
          level: ValidationLevel.ERROR,
          message: `Expected non-negative integer for uint field, got ${data}`,
          path,
          code: 'INVALID_UINT_VALUE'
        });
      } else {
        // Check range for unsigned integers
        const maxValue = Math.pow(2, byteLength * 8) - 1;
        if (data > maxValue) {
          results.push({
            level: ValidationLevel.ERROR,
            message: `Value ${data} exceeds maximum ${maxValue} for ${byteLength}-byte uint`,
            path,
            code: 'UINT_VALUE_OUT_OF_RANGE'
          });
        }
      }
    } else if (numberType === 'int') {
      if (!Number.isInteger(data)) {
        results.push({
          level: ValidationLevel.ERROR,
          message: `Expected integer for int field, got ${data}`,
          path,
          code: 'INVALID_INT_VALUE'
        });
      } else {
        // Check range for signed integers
        const maxValue = Math.pow(2, byteLength * 8 - 1) - 1;
        const minValue = -Math.pow(2, byteLength * 8 - 1);
        if (data > maxValue || data < minValue) {
          results.push({
            level: ValidationLevel.ERROR,
            message: `Value ${data} is out of range [${minValue}, ${maxValue}] for ${byteLength}-byte int`,
            path,
            code: 'INT_VALUE_OUT_OF_RANGE'
          });
        }
      }
    } else if (numberType === 'float') {
      if (!Number.isFinite(data)) {
        results.push({
          level: ValidationLevel.WARNING,
          message: `Float value ${data} is not finite`,
          path,
          code: 'NON_FINITE_FLOAT_VALUE'
        });
      }
      // Note: For 32-bit floats, we could check if the value can be represented exactly,
      // but that's quite complex and might not be necessary for most use cases
    }

    return results;
  }
};
