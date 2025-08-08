import { describe, expect, it } from 'vitest';
import { numberCodec } from '../../src/codecs/number';
import { toView } from '../helper';

describe('number.read', () => {
  it('should read uint8 correctly', () => {
    const view = toView([0x7F]);
    const result = numberCodec.read(
      view,
      {
        numberType: 'uint',
        byteOffset: 0,
        byteLength: 1
      }
    );
    expect(result).toBe(127);
  });

  it('should read int8 correctly (negative)', () => {
    const view = toView([0xFF]);
    const result = numberCodec.read(
      view,
      {
        numberType: 'int',
        byteOffset: 0,
        byteLength: 1
      }
    );
    expect(result).toBe(-1);
  });

  it('should read uint16 little-endian', () => {
    const view = toView([0x34, 0x12]);
    const result = numberCodec.read(
      view,
      {
        numberType: 'int',
        byteOffset: 0,
        byteLength: 2,
        littleEndian: true
      }
    );
    expect(result).toBe(0x1234);
  });

  it('should read uint16 big-endian', () => {
    const view = toView([0x34, 0x12]);
    const result = numberCodec.read(
      view,
      {
        numberType: 'uint',
        byteOffset: 0,
        byteLength: 2
      }
    );
    expect(result).toBe(0x3412);
  });

  it('reads float32 correctly', () => {
    const view = toView([0x00, 0x00, 0x20, 0x41]); // 10.0 in float32 (BE)
    const result = numberCodec.read(
      view,
      {
        numberType: 'float',
        byteOffset: 0,
        byteLength: 4,
        littleEndian: true
      }
    );
    expect(result).toBeCloseTo(10.0);
  });

  it('should throw on unsupported type', () => {
    const view = toView([0x00]);
    const fn = () => numberCodec.read(
      view,
      {
        numberType: 'unknown' as any,
        byteOffset: 0,
        byteLength: 1
      }
    );
    expect(fn).toThrow();
  });
});
