import { describe, expect, it } from 'vitest';
import { bitsetCodec } from '../../src/codecs/bitset';
import { dummyCtx, toView } from '../helper';

describe('bitset.read', () => {
  it('single byte, LSB-first', () => {
    // 0b10110010 = 0xB2
    // LSB-first: [bit0..bit7] = [0,1,0,0,1,1,0,1] -> [F,T,F,F,T,T,F,T]
    const view = toView([0xB2]);

    const out = bitsetCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 1
      },
      dummyCtx
    );

    expect(out).toEqual([false, true, false, false, true, true, false, true]);
  });

  it('multiple bytes, concatenated by bytes (LSB-first within each byte)', () => {
    // 0x01 -> [1,0,0,0,0,0,0,0]
    // 0x80 -> [0,0,0,0,0,0,0,1]  (LSB-first)
    const view = toView([0x01, 0x80]);
    const out = bitsetCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 2
      },
      dummyCtx
    );

    expect(out).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true
    ]);
  });

  it('respects base byteOffset', () => {
    const view = toView([0x00, 0x00, 0x00, 0xFF]);

    const out = bitsetCodec.read(
      view,
      {
        byteOffset: 3,
        byteLength: 1
      },
      dummyCtx
    );

    expect(out).toEqual([true, true, true, true, true, true, true, true]);
  });
});
