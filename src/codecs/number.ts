import type { Codec, MetaField } from '../types';

export type NumberType = 'uint' | 'int' | 'float';

export type NumberByteLength = 1 | 2 | 4;

export type NumberField = Omit<MetaField<'number'>, 'byteLength'> & {
  numberType: NumberType
  byteLength: NumberByteLength
};

// TODO bigint..
const typeToDataViewMethod: Record<string, keyof DataView> = {
  uint8: 'getUint8',
  int8: 'getInt8',
  uint16: 'getUint16',
  int16: 'getInt16',
  uint32: 'getUint32',
  int32: 'getInt32',
  float32: 'getFloat32'
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

    const method = typeToDataViewMethod[readerType];

    if (!method) {
      throw new Error(`Unsupported number type: ${numberType}`);
    }

    const isSingleByte = byteLength === 1;

    const fn = view[method] as (...args: any[]) => number;

    return isSingleByte ? fn.call(view, byteOffset) : fn.call(view, byteOffset, littleEndian);
  }
};
