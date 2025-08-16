import { describe, expect, it } from 'vitest';
import { bitsetCodec } from '../../src/codecs/bitset';
import { numberCodec } from '../../src/codecs/number';
import { createTestRegistry, toPlainView, toView, viewToArray } from '../helper';

const reg = createTestRegistry([numberCodec]);

describe('bitset.read', () => {
  it('should read single byte, LSB-first', () => {
    // 0b10110010 = 0xB2
    // LSB-first: [bit0..bit7] = [0,1,0,0,1,1,0,1] -> [F,T,F,F,T,T,F,T]
    const view = toView([0xB2]);

    const out = bitsetCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 1
      },
      reg.resolver()
    );

    expect(out).toEqual([false, true, false, false, true, true, false, true]);
  });

  it('should read multiple bytes, concatenated by bytes (LSB-first within each byte)', () => {
    // 0x01 -> [1,0,0,0,0,0,0,0]
    // 0x80 -> [0,0,0,0,0,0,0,1]  (LSB-first)
    const view = toView([0x01, 0x80]);
    const out = bitsetCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 2
      },
      reg.resolver()
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

  it('should respect non-zero byteOffset', () => {
    const view = toView([0x00, 0x00, 0x00, 0xFF]);

    const out = bitsetCodec.read(
      view,
      {
        byteOffset: 3,
        byteLength: 1
      },
      reg.resolver()
    );

    expect(out).toEqual([true, true, true, true, true, true, true, true]);
  });
});

describe('bitset.write', () => {
  it('should write single byte, LSB-first', () => {
    const view = toPlainView(1);
    const value = [false, true, false, false, true, true, false, true];

    bitsetCodec.write!(
      view,
      {
        byteOffset: 0,
        byteLength: 1
      },
      value,
      reg.resolver()
    );

    expect(viewToArray(view)).toEqual([0xB2]);
  });

  it('should read multiple bytes, concatenated by bytes (LSB-first within each byte)', () => {
    const view = toPlainView(2);
    const value = [
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
    ];

    bitsetCodec.write!(
      view,
      {
        byteOffset: 0,
        byteLength: 2
      },
      value,
      reg.resolver()
    );

    expect(viewToArray(view)).toEqual([0x01, 0x80]);
  });

  it('should respect non-zero byteOffset', () => {
    const view = toPlainView(4);
    const value = [true, true, true, true, true, true, true, true];

    bitsetCodec.write!(
      view,
      {
        byteOffset: 3,
        byteLength: 1
      },
      value,
      reg.resolver()
    );

    expect(viewToArray(view)).toEqual([0x00, 0x00, 0x00, 0xFF]);
  });
});
