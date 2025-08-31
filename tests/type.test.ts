import type { CodecSpec, Field } from 'binary-codec';
import { deserialize } from 'binary-codec';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { u8 } from './helper';

describe('type', () => {
  it('should match type', () => {
    const bytes = [
      0xAA,
      0xBB,
      0xCC,
      0xDD,
      0xEE,
      0xFF, // raw
      0x34,
      0x12,
      0x43,
      0x21, // number
      0x48,
      0x65,
      0x6C,
      0x6C,
      0x6F, // string
      0b11001101,
      0b10110011, // bitmask
      10,
      20,
      30, // array
      // nested object
      0xAA,
      0xBB,
      0xCC,
      0xDD,
      0xEE,
      0xFF, // raw
      0x34,
      0x12,
      0x43,
      0x21, // number
      0x48,
      0x65,
      0x6C,
      0x6C,
      0x6F, // string
      0b11001101,
      0b10110011, // bitmask
      10,
      20,
      30 // array
    ];

    const buf = u8(bytes);

    const fields = [
      {
        name: 'raw1',
        type: 'raw',
        byteOffset: 0,
        byteLength: 6
      },
      {
        name: 'num1',
        type: 'number',
        numberType: 'uint',
        byteOffset: 6,
        byteLength: 2
      },
      {
        name: 'num2',
        type: 'number',
        numberType: 'uint',
        byteOffset: 8,
        byteLength: 2
      },
      {
        name: 'str1',
        type: 'string',
        byteOffset: 10,
        byteLength: 5
      },
      {
        name: 'bitmask1',
        type: 'bitmask',
        byteOffset: 15,
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
      },
      {
        name: 'array1',
        type: 'array',
        byteOffset: 17,
        byteLength: 3,
        item: {
          type: 'number',
          numberType: 'uint',
          byteLength: 1
        }
      }
    ] as const satisfies Field[];

    const spec = {
      byteLength: 40,
      fields: [
        ...fields,
        {
          name: 'obj1',
          type: 'object',
          byteOffset: 20,
          byteLength: 20,
          fields
        }
      ]
    } as const satisfies CodecSpec;

    const out = deserialize(spec, buf);

    expect(out).toEqual({
      raw1: new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]),
      num1: 0x3412,
      num2: 0x4321,
      str1: 'Hello',
      bitmask1: {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      },
      array1: [10, 20, 30],
      obj1: {
        raw1: new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]),
        num1: 0x3412,
        num2: 0x4321,
        str1: 'Hello',
        bitmask1: {
          num1: 1,
          flag1: true,
          num2: 6,
          str1: 'David',
          num3: 3,
          flag2: false,
          str2: 'David'
        },
        array1: [10, 20, 30]
      }
    });

    type resultType = {
      raw1: Uint8Array
      num1: number
      num2: number
      str1: string
      bitmask1: {
        num1: number
        flag1: boolean
        num2: number
        str1: 'Josh' | 'Harry' | 'Mark' | 'David'
        num3: number
        flag2: boolean
        str2: 'Josh' | 'Harry' | 'Mark' | 'David' | 'Mike' | 'Sara' | 'Lisa' | 'Tom'
      }
      array1: number[]
      obj1: {
        raw1: Uint8Array
        num1: number
        num2: number
        str1: string
        bitmask1: {
          num1: number
          flag1: boolean
          num2: number
          str1: 'Josh' | 'Harry' | 'Mark' | 'David'
          num3: number
          flag2: boolean
          str2: 'Josh' | 'Harry' | 'Mark' | 'David' | 'Mike' | 'Sara' | 'Lisa' | 'Tom'
        }
        array1: number[]
      }
    };

    expectTypeOf(out).toEqualTypeOf<resultType>();
  });
});
