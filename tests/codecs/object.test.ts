import type { Field } from '../../src/types.ts';
import { describe, expect, it } from 'vitest';
import { arrayCodec } from '../../src/codecs/array.ts';
import { bitmaskCodec } from '../../src/codecs/bitmask.ts';
import { numberCodec } from '../../src/codecs/number.ts';
import { objectCodec } from '../../src/codecs/object.ts';
import { rawCodec } from '../../src/codecs/raw.ts';
import { stringCodec } from '../../src/codecs/string.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { createTestRegistry, toPlainView, toView, viewToArray } from '../helper.ts';

const reg = createTestRegistry([
  rawCodec,
  numberCodec,
  stringCodec,
  bitmaskCodec,
  arrayCodec,
  objectCodec
]);

describe('object', () => {
  describe('read', () => {
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

  describe('write', () => {
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

  describe('validate', () => {
    it('should pass validation for valid object field specs', () => {
      const validSpec = {
        name: 'test',
        type: 'object',
        byteOffset: 0,
        byteLength: 10,
        fields: [
          {
            name: 'id',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          },
          {
            name: 'name',
            type: 'string',
            byteOffset: 4,
            byteLength: 6
          }
        ]
      } as any;

      const results = objectCodec.validate!(validSpec, 'test', reg.resolver());
      expect(results).toHaveLength(0);
    });

    it('should detect missing fields array', () => {
      const invalidSpec = {
        name: 'test',
        type: 'object',
        byteOffset: 0,
        byteLength: 10
      } as any;

      const results = objectCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('MISSING_OBJECT_FIELDS');
    });

    it('should warn about empty fields array', () => {
      const invalidSpec = {
        name: 'test',
        type: 'object',
        byteOffset: 0,
        byteLength: 10,
        fields: []
      } as any;

      const results = objectCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.WARNING);
      expect(results[0].code).toBe('EMPTY_OBJECT_FIELDS');
    });

    it('should detect fields extending beyond object bounds', () => {
      const invalidSpec = {
        name: 'test',
        type: 'object',
        byteOffset: 0,
        byteLength: 5,
        fields: [
          {
            name: 'id',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          },
          {
            name: 'name',
            type: 'string',
            byteOffset: 3,
            byteLength: 6 // extends beyond object boundary
          }
        ]
      } as any;

      const results = objectCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('OBJECT_FIELD_OUT_OF_BOUNDS');
      expect(results[0].message).toContain('name');
    });

    it('should detect validation errors in nested fields', () => {
      const invalidSpec = {
        name: 'test',
        type: 'object',
        byteOffset: 0,
        byteLength: 10,
        fields: [
          {
            name: 'invalidNumber',
            type: 'number',
            numberType: 'float',
            byteOffset: 0,
            byteLength: 3 // Invalid - float must be 4 bytes
          }
        ]
      } as any;

      const results = objectCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('INVALID_NUMBER_TYPE_LENGTH');
      expect(results[0].path).toBe('test.fields[0]');
    });

    it('should detect validation errors with correct path in nested array bitmask items', () => {
      const invalidSpec = {
        name: 'test',
        type: 'object',
        byteOffset: 0,
        byteLength: 10,
        fields: [
          {
            name: 'bitmaskArray',
            type: 'array',
            byteOffset: 0,
            byteLength: 4,
            item: {
              type: 'bitmask',
              byteLength: 2,
              map: {
                invalidField: {
                  bits: 20, // Invalid - exceeds 16 bits (2 bytes * 8)
                  type: 'boolean'
                }
              }
            }
          }
        ]
      } as any;

      const results = objectCodec.validate!(invalidSpec, 'testObject', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('BIT_OUT_OF_RANGE');
      expect(results[0].path).toBe('testObject.fields[0].item.map.invalidField');
    });
  });
});
