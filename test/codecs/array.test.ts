import { describe, expect, it } from 'vitest';
import { arrayCodec } from '../../src/codecs/array';
import { bitmaskCodec } from '../../src/codecs/bitmask';
import { numberCodec } from '../../src/codecs/number';
import { createTestRegistry, toView } from '../helper';

describe('array.read', () => {
  const reg = createTestRegistry([numberCodec, bitmaskCodec]);

  it('should read an array of uint8 values', () => {
    const view = toView([10, 20, 30]);

    const result = arrayCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 3,
        item: {
          type: 'number',
          numberType: 'uint',
          byteLength: 1
        }
      },
      reg.resolver()
    );

    expect(result).toEqual([10, 20, 30]);
  });

  it('should read an array of uint16 values', () => {
    const view = toView([0x01, 0x00, 0x01, 0x01, 0x01, 0x02]);

    const result = arrayCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 6,
        item: {
          type: 'number',
          numberType: 'uint',
          byteLength: 2
        }
      },
      reg.resolver()
    );

    expect(result).toEqual([256, 257, 258]);
  });

  it('should read an array of bitmask values', () => {
    const view = toView([0b11001101, 0b10110011, 0b11001101, 0b10110011, 0b11001101, 0b10110011]);

    const result = arrayCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 6,
        item: {
          type: 'bitmask',
          byteLength: 2,
          map: {
            num1: {
              bits: 15,
              type: 'uint'
            },
            flag1: {
              bits: 14,
              type: 'boolean'
            },
            num2: {
              bits: [13, 9],
              type: 'uint'
            },
            str1: {
              bits: [8, 7],
              type: 'enum',
              values: ['Josh', 'Harry', 'Mark', 'David']
            },
            num3: {
              bits: [6, 4],
              type: 'uint'
            },
            flag2: {
              bits: 3,
              type: 'boolean'
            },
            str2: {
              bits: [2, 0],
              type: 'enum',
              values: ['Josh', 'Harry', 'Mark', 'David', 'Mike', 'Sara', 'Lisa', 'Tom']
            }
          }
        }
      },
      reg.resolver()
    );

    expect(result).toEqual([
      {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      },
      {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      },
      {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      }
    ]);
  });
});
