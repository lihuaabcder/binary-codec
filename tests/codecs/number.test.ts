import { describe, expect, it } from 'vitest';
import { numberCodec } from '../../src/codecs/number.ts';
import { dummyCtx, toPlainView, toView, viewToArray } from '../helper.ts';

describe('number.read', () => {
  it('should read uint8 correctly', () => {
    const view = toView([0x7F]);
    const result = numberCodec.read(
      view,
      {
        numberType: 'uint',
        byteOffset: 0,
        byteLength: 1
      },
      dummyCtx
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
      },
      dummyCtx
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
      },
      dummyCtx
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
      },
      dummyCtx
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
      },
      dummyCtx
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
      },
      dummyCtx
    );
    expect(fn).toThrow();
  });
});

describe('number.write', () => {
  it('should write uint8 correctly', () => {
    const view = toPlainView(1);
    const value = 255;

    numberCodec.write!(
      view,
      {
        numberType: 'uint',
        byteOffset: 0,
        byteLength: 1
      },
      value,
      dummyCtx
    );

    expect(viewToArray(view)).toEqual([0xFF]);
  });

  it('should write int8 correctly (negative)', () => {
    const view = toPlainView(1);
    const value = -1;

    numberCodec.write!(
      view,
      {
        numberType: 'int',
        byteOffset: 0,
        byteLength: 1
      },
      value,
      dummyCtx
    );

    expect(viewToArray(view)).toEqual([0xFF]);
  });

  it('should write uint16 little-endian', () => {
    const view = toPlainView(2);
    const value = 0x1234;

    numberCodec.write!(
      view,
      {
        numberType: 'uint',
        byteOffset: 0,
        byteLength: 2,
        littleEndian: true
      },
      value,
      dummyCtx
    );

    expect(viewToArray(view)).toEqual([0x34, 0x12]);
  });

  it('should write uint16 big-endian (default)', () => {
    const view = toPlainView(2);
    const value = 0x1234;

    numberCodec.write!(
      view,
      {
        numberType: 'uint',
        byteOffset: 0,
        byteLength: 2
      },
      value,
      dummyCtx
    );

    expect(viewToArray(view)).toEqual([0x12, 0x34]);
  });

  it('should write float32 corrently', () => {
    const view = toPlainView(4);
    const value = 10.0;

    numberCodec.write!(
      view,
      {
        numberType: 'float',
        byteOffset: 0,
        byteLength: 4,
        littleEndian: true
      },
      value,
      dummyCtx
    );

    expect(viewToArray(view)).toEqual([0x00, 0x00, 0x20, 0x41]);
  });

  it('should respect non-zero byteOffset', () => {
    const view = toPlainView(10);
    const value = 10.0;

    numberCodec.write!(
      view,
      {
        numberType: 'float',
        byteOffset: 6,
        byteLength: 4,
        littleEndian: true
      },
      value,
      dummyCtx
    );

    expect(viewToArray(view)).toEqual([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x41]);
  });

  it('should throw on unsupported type', () => {
    const view = toPlainView(1);
    const value = 255;

    const fn = () => numberCodec.write!(
      view,
      {
        numberType: 'uint',
        byteOffset: 0,
        byteLength: 3 as any
      },
      value,
      dummyCtx
    );

    expect(fn).toThrow();
  });

  it('should throw when value out of range', () => {
    // todo: ideally have a optional validate fn in codec

    // const view = toPlainView(1);
    // const value = 256;

    // const fn = () => numberCodec.write!(
    //   view,
    //   {
    //     numberType: 'uint',
    //     byteOffset: 0,
    //     byteLength: 1
    //   },
    //   value,
    //   dummyCtx
    // );

    // expect(fn).toThrow();
  });
});
