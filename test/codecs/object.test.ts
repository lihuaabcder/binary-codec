import type { Field } from '../../src/types';
import { describe, expect, it } from 'vitest';
import { arrayCodec } from '../../src/codecs/array';
import { bitmaskCodec } from '../../src/codecs/bitmask';
import { numberCodec } from '../../src/codecs/number';
import { objectCodec } from '../../src/codecs/object';
import { rawCodec } from '../../src/codecs/raw';
import { stringCodec } from '../../src/codecs/string';
import { createTestRegistry, toPlainView, toView, viewToArray } from '../helper';

const reg = createTestRegistry([
  rawCodec,
  numberCodec,
  stringCodec,
  bitmaskCodec,
  arrayCodec,
  objectCodec
]);

describe('object.read', () => {
  it('should read an object with raw field', () => {
    const view = toView([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);

    const result = objectCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 6,
        fields: [{
          name: 'raw1',
          type: 'raw',
          byteOffset: 2,
          byteLength: 3
        }]
      },
      reg.resolver()
    );

    expect(result).toEqual({
      raw1: new Uint8Array([0xCC, 0xDD, 0xEE])
    });
  });

  it('should read an object with number field', () => {
    const view = toView([0x34, 0x12, 0x43, 0x21]);
    const result = objectCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 4,
        fields: [{
          name: 'num1',
          type: 'number',
          numberType: 'uint',
          byteOffset: 2,
          byteLength: 2
        }]
      },
      reg.resolver()
    );
    expect(result).toEqual({
      num1: 0x4321
    });
  });

  it('should read an object with string field', () => {
    const view = toView([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
    const result = objectCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 5,
        fields: [{
          name: 'str1',
          type: 'string',
          byteOffset: 0,
          byteLength: 5
        }]
      },
      reg.resolver()
    );
    expect(result).toEqual({
      str1: 'Hello'
    });
  });

  it('should read an object with bitmask field', () => {
    const view = toView([0b11001101, 0b10110011]);
    const result = objectCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 2,
        fields: [{
          name: 'bitmask1',
          type: 'bitmask',
          byteOffset: 0,
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
        }]
      },
      reg.resolver()
    );
    expect(result).toEqual({
      bitmask1: {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      }
    });
  });

  it('should read an object with array field', () => {
    const view = toView([10, 20, 30]);
    const result = objectCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 3,
        fields: [{
          name: 'array1',
          type: 'array',
          byteOffset: 0,
          byteLength: 3,
          item: {
            type: 'number',
            numberType: 'uint',
            byteLength: 1
          }
        }]
      },
      reg.resolver()
    );
    expect(result).toEqual({
      array1: [10, 20, 30]
    });
  });

  it('should read an object with nested object field', () => {
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

    const view = toView(bytes);

    const fields: Field[] = [
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
    ];

    const result = objectCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: bytes.length,
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
      },
      reg.resolver()
    );

    expect(result).toEqual({
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
  });
});

describe('object.write', () => {
  it('should write an object with raw field', () => {
    const view = toPlainView(6);
    const value = {
      raw1: new Uint8Array([0xCC, 0xDD, 0xEE])
    };

    objectCodec.write!(
      view,
      {
        byteOffset: 0,
        byteLength: 6,
        fields: [{
          name: 'raw1',
          type: 'raw',
          byteOffset: 2,
          byteLength: 3
        }]
      },
      value,
      reg.resolver()
    );

    expect(viewToArray(view)).toEqual([0, 0, 0xCC, 0xDD, 0xEE, 0]);
  });

  it('should write an object with number field', () => {
    const view = toPlainView(4);
    const value = {
      num1: 0x4321
    };
    objectCodec.write!(
      view,
      {
        byteOffset: 0,
        byteLength: 4,
        fields: [{
          name: 'num1',
          type: 'number',
          numberType: 'uint',
          byteOffset: 2,
          byteLength: 2
        }]
      },
      value,
      reg.resolver()
    );
    expect(viewToArray(view)).toEqual([0x00, 0x00, 0x43, 0x21]);
  });

  it('should write an object with string field', () => {
    const view = toPlainView(5);
    const value = {
      str1: 'Hello'
    };
    objectCodec.write!(
      view,
      {
        byteOffset: 0,
        byteLength: 5,
        fields: [{
          name: 'str1',
          type: 'string',
          byteOffset: 0,
          byteLength: 5
        }]
      },
      value,
      reg.resolver()
    );
    expect(viewToArray(view)).toEqual([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
  });

  it('should read an object with bitmask field', () => {
    const view = toPlainView(2);

    const value = {
      bitmask1: {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      }
    };

    objectCodec.write!(
      view,
      {
        byteOffset: 0,
        byteLength: 2,
        fields: [{
          name: 'bitmask1',
          type: 'bitmask',
          byteOffset: 0,
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
        }]
      },
      value,
      reg.resolver()
    );

    expect(viewToArray(view)).toEqual([0b11001101, 0b10110011]);
  });

  it('should read an object with array field', () => {
    const view = toPlainView(3);
    const value = {
      array1: [10, 20, 30]
    };

    objectCodec.write!(
      view,
      {
        byteOffset: 0,
        byteLength: 3,
        fields: [{
          name: 'array1',
          type: 'array',
          byteOffset: 0,
          byteLength: 3,
          item: {
            type: 'number',
            numberType: 'uint',
            byteLength: 1
          }
        }]
      },
      value,
      reg.resolver()
    );

    expect(viewToArray(view)).toEqual([10, 20, 30]);
  });

  it('should write an object with nested object field', () => {
    const view = toPlainView(40);
    const value = {
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
    };

    const fields: Field[] = [
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
    ];

    objectCodec.write!(
      view,
      {
        byteOffset: 0,
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
      },
      value,
      reg.resolver()
    );

    expect(viewToArray(view)).toEqual([
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
    ]);
  });
});
