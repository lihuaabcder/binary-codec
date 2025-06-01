import { describe, expect, it } from 'vitest';
import { readNumber } from '../../src/reader/readNumber';
import { toView } from '../helper';

describe('readNumber', () => {
  it('should read uint8 correctly', () => {
    const view = toView([0x7F]);
    const result = readNumber(view, 'uint', 0, 1);
    expect(result).toBe(127);
  });

  it('should read int8 correctly (negative)', () => {
    const view = toView([0xFF]);
    const result = readNumber(view, 'int', 0, 1);
    expect(result).toBe(-1);
  });

  it('should read uint16 little-endian', () => {
    const view = toView([0x34, 0x12]);
    const result = readNumber(view, 'uint', 0, 2, true);
    expect(result).toBe(0x1234);
  });

  it('should read uint16 big-endian', () => {
    const view = toView([0x34, 0x12]);
    const result = readNumber(view, 'uint', 0, 2);
    expect(result).toBe(0x3412);
  });

  it('reads float32 correctly', () => {
    const view = toView([0x00, 0x00, 0x20, 0x41]); // 10.0 in float32 (BE)
    expect(readNumber(view, 'float', 0, 4, true)).toBeCloseTo(10.0);
  });

  it('should throw on unsupported type', () => {
    const view = toView([0x00]);
    expect(() => readNumber(view, 'unknown' as any, 0, 1)).toThrow();
  });
});