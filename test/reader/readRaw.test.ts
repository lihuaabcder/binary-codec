import { describe, expect, it } from 'vitest';
import { readRaw } from '../../src/reader/readRaw';
import { toView } from '../helper';


describe('readRaw', () => {
  it('should extract correct bytes from buffer', () => {
    const view = toView([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);

    const result = readRaw(view, 2, 3);

    expect(Array.from(result)).toEqual([0xCC, 0xDD, 0xEE]);
  });

  it('should return empty array if length is zero', () => {
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    const result = readRaw(view, 0, 0);
    expect(result.length).toBe(0);
    expect(Array.from(result)).toEqual([]);
  });

  it('should mutate the original buffer', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    const raw = readRaw(view, 1, 2);
    raw[0] = 0x99;
    expect(view.getUint8(1)).toBe(0x99);
  });

  it('should throw if offset out of range', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    expect(() => readRaw(view, 5)).toThrow(RangeError);
  });
});
