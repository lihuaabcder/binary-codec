import { describe, expect, it } from 'vitest';
import { arrayCodec } from '../../src/codecs/array.ts';
import { bitmaskCodec } from '../../src/codecs/bitmask.ts';
import { numberCodec } from '../../src/codecs/number.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { createTestRegistry, toPlainView, toView, viewToArray } from '../helper.ts';

const reg = createTestRegistry([numberCodec, bitmaskCodec]);

describe('array', () => {
  describe('read', () => {
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

  describe('write', () => {
    it('should write an array of uint8 values', () => {
      const view = toPlainView(3);
      const value = [10, 20, 30];

      arrayCodec.write!(
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
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual(value);
    });

    it('should write an array of uint16 values', () => {
      const view = toPlainView(6);
      const value = [256, 257, 258];

      arrayCodec.write!(
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
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0x01, 0x00, 0x01, 0x01, 0x01, 0x02]);
    });

    it('should write an array of bitmask values', () => {
      const view = toPlainView(6);
      const value = [
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
      ];

      arrayCodec.write!(
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
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0b11001101, 0b10110011, 0b11001101, 0b10110011, 0b11001101, 0b10110011]);
    });

    it('should respect non-zero byteOffset', () => {
      const view = toPlainView(10);
      const value = [
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
      ];

      arrayCodec.write!(
        view,
        {
          byteOffset: 4,
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
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0x00, 0x00, 0x00, 0x00, 0b11001101, 0b10110011, 0b11001101, 0b10110011, 0b11001101, 0b10110011]);
    });
  });

  describe('validate', () => {
    it('should pass validation for valid array field specs', () => {
      const validSpec = {
        name: 'test',
        type: 'array',
        byteOffset: 0,
        byteLength: 8,
        item: {
          type: 'number',
          numberType: 'uint',
          byteLength: 2
        }
      } as const;

      const results = arrayCodec.validate!(validSpec, 'test', reg.resolver());
      expect(results).toHaveLength(0);
    });

    it('should detect missing item specification', () => {
      const invalidSpec = {
        name: 'test',
        type: 'array',
        byteOffset: 0,
        byteLength: 8
      } as any;

      const results = arrayCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('MISSING_ARRAY_ITEM');
    });

    it('should detect invalid item byteLength', () => {
      const invalidSpec = {
        name: 'test',
        type: 'array',
        byteOffset: 0,
        byteLength: 8,
        item: {
          type: 'number',
          numberType: 'uint',
          byteLength: 0
        }
      } as any;

      const results = arrayCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('INVALID_ARRAY_ITEM_LENGTH');
    });

    it('should warn when array length is not divisible by item length', () => {
      const invalidSpec = {
        name: 'test',
        type: 'array',
        byteOffset: 0,
        byteLength: 7, // Not divisible by 2
        item: {
          type: 'number',
          numberType: 'uint',
          byteLength: 2
        }
      } as const;

      const results = arrayCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.WARNING);
      expect(results[0].code).toBe('ARRAY_LENGTH_NOT_DIVISIBLE');
    });

    it('should detect validation errors in array item type', () => {
      const invalidSpec = {
        name: 'test',
        type: 'array',
        byteOffset: 0,
        byteLength: 6,
        item: {
          type: 'number',
          numberType: 'float',
          byteLength: 3 // Invalid - float must be 4 bytes
        }
      } as any;

      const results = arrayCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('INVALID_NUMBER_TYPE_LENGTH');
      expect(results[0].path).toBe('test.item');
    });

    it('should detect validation errors with correct path in nested bitmask items', () => {
      const invalidSpec = {
        name: 'test',
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
      } as any;

      const results = arrayCodec.validate!(invalidSpec, 'testArray', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('BIT_OUT_OF_RANGE');
      expect(results[0].path).toBe('testArray.item.map.invalidField');
    });
  });
});
