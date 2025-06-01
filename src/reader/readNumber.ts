import type { NumberType } from '../types';
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

export function readNumber(
  view: DataView,
  type: NumberType,
  byteOffset: number,
  byteLength: number,
  littleEndian = false
): number {
  const readerType = `${type}${byteLength * 8}`;

  const method = typeToDataViewMethod[readerType];

  if (!method) {
    throw new Error(`Unsupported number type: ${type}`);
  }

  const isSingleByte = byteLength === 1;

  const fn = view[method] as (...args: any[]) => number;

  return isSingleByte ? fn.call(view, byteOffset) : fn.call(view, byteOffset, littleEndian);
}