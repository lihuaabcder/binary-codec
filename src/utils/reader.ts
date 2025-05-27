import type { NumberType } from '../types';

export function readRaw(
  view: DataView,
  byteOffset: number,
  byteLength?: number
): Uint8Array {
  return new Uint8Array(view.buffer, byteOffset, byteLength);
}

export function readString(
  view: DataView,
  byteOffset: number,
  byteLength?: number,
  encoding = 'utf-8',
  trimNull: boolean = true
): string {
  const decoder = new TextDecoder(
    encoding,
    {
      fatal: false,
      ignoreBOM: false // TODO: BOM compatible
    }
  );

  const bytes = readRaw(view, byteOffset, byteLength);
  const text = decoder.decode(bytes);
  return trimNull ? text.replace(/\0+$/, '') : text;
}

// TODO bigint..
const typeToReader: Record<NumberType, keyof DataView> = {
  uint8: 'getUint8',
  int8: 'getInt8',
  uint16: 'getUint16',
  int16: 'getInt16',
  uint32: 'getUint32',
  int32: 'getInt32',
  float32: 'getFloat32',
  float64: 'getFloat64'
};

export function readNumber(
  view: DataView,
  type: NumberType,
  byteOffset: number,
  littleEndian = false
): number {
  const reader = typeToReader[type];

  if (!reader) {
    throw new Error(`Unsupported number type: ${type}`);
  }

  const isSingleByte = type === 'int8' || type === 'uint8';

  const fn = view[reader] as (...args: any[]) => number;

  return isSingleByte ? fn(byteOffset) : fn(byteOffset, littleEndian);
}
