import { describe, expect, it } from 'vitest';
import { rawCodec } from '../../src/codecs/raw';
import { dummyCtx, toView } from '../helper';

describe('raw.read', () => {
  it('should extract correct bytes from buffer', () => {
    const view = toView([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);

    const result = rawCodec.read(
      view,
      {
        byteOffset: 2,
        byteLength: 3
      },
      dummyCtx
    );

    expect(Array.from(result)).toEqual([0xCC, 0xDD, 0xEE]);
  });

  it('should return empty array if length is zero', () => {
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    const result = rawCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 0
      },
      dummyCtx
    );
    expect(result.length).toBe(0);
    expect(Array.from(result)).toEqual([]);
  });

  it('should mutate the original buffer', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    const raw = rawCodec.read(
      view,
      {
        byteOffset: 1,
        byteLength: 2
      },
      dummyCtx
    );
    raw[0] = 0x99;
    expect(view.getUint8(1)).toBe(0x99);
  });

  it('should throw if offset out of range', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    expect(() => rawCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 5
      },
      dummyCtx
    )).toThrow(RangeError);
  });
});
