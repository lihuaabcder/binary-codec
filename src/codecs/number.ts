import type { Codec, MetaField } from '../types';

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
  }
};
