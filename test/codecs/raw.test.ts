import { describe, expect, it } from 'vitest';
import { rawCodec } from '../../src/codecs/raw';
import { dummyCtx, toPlainView, toView } from '../helper';

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

describe('raw.write', () => {
  it('should write Uint8Array data at the correct offset', () => {
    const view = toPlainView(6);

    const value = new Uint8Array([0xCC, 0xDD, 0xEE]);

    rawCodec.write!(
      view,
      {
        byteOffset: 2,
        byteLength: 3
      },
      value,
      dummyCtx
    );

    const arr = new Uint8Array(view.buffer);
    expect(arr.slice(0, 2)).toEqual(new Uint8Array([0, 0]));
    expect(arr.slice(2, 5)).toEqual(value);
    expect(arr.slice(5, 6)).toEqual(new Uint8Array([0]));
  });

  it('should throw if value out of range', () => {
    const view = toPlainView(3);
    const value = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD, 0xEE]);

    expect(
      () => rawCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 3
        },
        value,
        dummyCtx
      )
    ).toThrow(RangeError);
  });
});
