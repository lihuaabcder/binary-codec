import type { BitmaskMap } from 'binary-codec';
import { bitmaskCodec, numberCodec, ValidationLevel } from 'binary-codec';
import { describe, expect, it } from 'vitest';
import { createTestRegistry, toPlainView, toView, viewToArray } from '../helper';

const reg = createTestRegistry([numberCodec]);

describe('bitmask', () => {
  describe('read', () => {
    it('should read boolean fields', () => {
      const view = toView([0b10101010]);
      const map: BitmaskMap = Array.from({
        length: 8
      }).fill(0).reduce<BitmaskMap>((result, _, i) => {
        return {
          ...result,
          [`flag${i}`]: {
            bits: i,
            type: 'boolean'
          }
        };
      }, {});

      const result = bitmaskCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 1,
          map
        },
        reg.resolver()
      );

      expect(result).toEqual({
        flag0: false,
        flag1: true,
        flag2: false,
        flag3: true,
        flag4: false,
        flag5: true,
        flag6: false,
        flag7: true
      });
    });

    it('should read number fields by bit position', () => {
      const view = toView([0b10101010]);
      const map: BitmaskMap = Array.from({
        length: 8
      }).fill(0).reduce<BitmaskMap>((result, _, i) => {
        return {
          ...result,
          [`flag${i}`]: {
            bits: i,
            type: 'uint'
          }
        };
      }, {});

      const result = bitmaskCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 1,
          map
        },
        reg.resolver()
      );

      expect(result).toEqual({
        flag0: 0,
        flag1: 1,
        flag2: 0,
        flag3: 1,
        flag4: 0,
        flag5: 1,
        flag6: 0,
        flag7: 1
      });
    });

    it('should read number fields by bit range (big-endian)', () => {
      const view = toView([0b11001101, 0b10110011]);
      const map: BitmaskMap = {
        num1: {
          bits: [15, 14],
          type: 'uint'
        },
        num2: {
          bits: [13, 11],
          type: 'uint'
        },
        num3: {
          bits: [10, 7],
          type: 'uint'
        },
        num4: {
          bits: [6, 2],
          type: 'uint'
        },
        num5: {
          bits: [1, 0],
          type: 'uint'
        }
      };

      const result = bitmaskCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 2,
          map
        },
        reg.resolver()
      );

      expect(result).toEqual({
        num1: 3,
        num2: 1,
        num3: 11,
        num4: 12,
        num5: 3
      });
    });

    it('should read number fields by bit range (little-endian)', () => {
      const view = toView([0b11001101, 0b10110011]);
      const map: BitmaskMap = {
        num1: {
          bits: [15, 14],
          type: 'uint'
        },
        num2: {
          bits: [13, 11],
          type: 'uint'
        },
        num3: {
          bits: [10, 7],
          type: 'uint'
        },
        num4: {
          bits: [6, 2],
          type: 'uint'
        },
        num5: {
          bits: [1, 0],
          type: 'uint'
        }
      };

      const result = bitmaskCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 2,
          map,
          littleEndian: true
        },
        reg.resolver()
      );

      expect(result).toEqual({
        num1: 2,
        num2: 6,
        num3: 7,
        num4: 19,
        num5: 1
      });
    });

    it('should read enum fields by bit postion and bit range', () => {
      const view = toView([0b00011011]);
      const names = ['Josh', 'Harry', 'Mark', 'David']; // 00 01 10 11
      const map: BitmaskMap = {
        name1: {
          bits: [7, 6],
          type: 'enum',
          values: names
        },
        name2: {
          bits: [5, 4],
          type: 'enum',
          values: names
        },
        name3: {
          bits: [3, 2],
          type: 'enum',
          values: names
        },
        name4: {
          bits: [1, 0],
          type: 'enum',
          values: names
        }
      };

      const result = bitmaskCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 1,
          map
        },
        reg.resolver()
      );

      expect(result).toEqual({
        name1: 'Josh',
        name2: 'Harry',
        name3: 'Mark',
        name4: 'David'
      });
    });

    it('should read combination fields', () => {
      const view = toView([0b11001101, 0b10110011]);
      const map: BitmaskMap = {
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
      };

      const result = bitmaskCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 2,
          map
        },
        reg.resolver()
      );

      expect(result).toEqual({
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      });
    });
  });

  describe('write', () => {
    it('should write boolean fields', () => {
      const view = toPlainView(1);

      const value = {
        flag0: false,
        flag1: true,
        flag2: false,
        flag3: true,
        flag4: false,
        flag5: true,
        flag6: false,
        flag7: true
      };

      const map: BitmaskMap = Array.from({
        length: 8
      }).fill(0).reduce<BitmaskMap>((result, _, i) => {
        return {
          ...result,
          [`flag${i}`]: {
            bits: i,
            type: 'boolean'
          }
        };
      }, {});

      bitmaskCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 1,
          map
        },
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0b10101010]);
    });

    it('should write number fields by bit position', () => {
      const view = toPlainView(1);
      const value = {
        flag0: 0,
        flag1: 1,
        flag2: 0,
        flag3: 1,
        flag4: 0,
        flag5: 1,
        flag6: 0,
        flag7: 1
      };

      const map: BitmaskMap = Array.from({
        length: 8
      }).fill(0).reduce<BitmaskMap>((result, _, i) => {
        return {
          ...result,
          [`flag${i}`]: {
            bits: i,
            type: 'uint'
          }
        };
      }, {});

      bitmaskCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 1,
          map
        },
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0b10101010]);
    });

    it('should write number fields by bit range (big-endian)', () => {
      const view = toPlainView(2);
      const value = {
        num1: 3,
        num2: 1,
        num3: 11,
        num4: 12,
        num5: 3
      };

      const map: BitmaskMap = {
        num1: {
          bits: [15, 14],
          type: 'uint'
        },
        num2: {
          bits: [13, 11],
          type: 'uint'
        },
        num3: {
          bits: [10, 7],
          type: 'uint'
        },
        num4: {
          bits: [6, 2],
          type: 'uint'
        },
        num5: {
          bits: [1, 0],
          type: 'uint'
        }
      };

      bitmaskCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 2,
          map
        },
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0b11001101, 0b10110011]);
    });

    it('should write number fields by bit range (little-endian)', () => {
      const view = toPlainView(2);
      const value = {
        num1: 2,
        num2: 6,
        num3: 7,
        num4: 19,
        num5: 1
      };

      const map: BitmaskMap = {
        num1: {
          bits: [15, 14],
          type: 'uint'
        },
        num2: {
          bits: [13, 11],
          type: 'uint'
        },
        num3: {
          bits: [10, 7],
          type: 'uint'
        },
        num4: {
          bits: [6, 2],
          type: 'uint'
        },
        num5: {
          bits: [1, 0],
          type: 'uint'
        }
      };

      bitmaskCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 2,
          map,
          littleEndian: true
        },
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0b11001101, 0b10110011]);
    });

    it('should write enum fields by bit postion and bit range', () => {
      const view = toPlainView(1);
      const value = {
        name1: 'Josh',
        name2: 'Harry',
        name3: 'Mark',
        name4: 'David'
      };

      const names = ['Josh', 'Harry', 'Mark', 'David']; // 00 01 10 11
      const map: BitmaskMap = {
        name1: {
          bits: [7, 6],
          type: 'enum',
          values: names
        },
        name2: {
          bits: [5, 4],
          type: 'enum',
          values: names
        },
        name3: {
          bits: [3, 2],
          type: 'enum',
          values: names
        },
        name4: {
          bits: [1, 0],
          type: 'enum',
          values: names
        }
      };

      bitmaskCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 1,
          map
        },
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0b00011011]);
    });

    it('should write combination fields', () => {
      const view = toPlainView(2);
      const value = {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      };

      const map: BitmaskMap = {
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
      };

      bitmaskCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 2,
          map
        },
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0b11001101, 0b10110011]);
    });

    it('should respect non-zero byteOffset', () => {
      const view = toPlainView(4);
      const value = {
        num1: 1,
        flag1: true,
        num2: 6,
        str1: 'David',
        num3: 3,
        flag2: false,
        str2: 'David'
      };

      const map: BitmaskMap = {
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
      };

      bitmaskCodec.write!(
        view,
        {
          byteOffset: 2,
          byteLength: 2,
          map
        },
        value,
        reg.resolver()
      );

      expect(viewToArray(view)).toEqual([0x00, 0x00, 0b11001101, 0b10110011]);
    });
  });

  describe('validate', () => {
    it('should pass validation for valid bitmask field specs', () => {
      const validSpec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 2,
        map: {
          flag1: {
            bits: 0,
            type: 'boolean'
          },
          flag2: {
            bits: 15,
            type: 'boolean'
          },
          value1: {
            bits: [7, 4],
            type: 'uint'
          },
          status: {
            bits: [3, 2],
            type: 'enum',
            values: ['a', 'b', 'c', 'd']
          }
        }
      } as any;

      const results = bitmaskCodec.validate!(validSpec, 'test', reg.resolver());
      expect(results).toHaveLength(0);
    });

    it('should detect bit positions out of range', () => {
      const invalidSpec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1, // Only 8 bits available (0-7)
        map: {
          flag1: {
            bits: 8,
            type: 'boolean'
          } // Out of range
        }
      } as const;

      const results = bitmaskCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('BIT_OUT_OF_RANGE');
      expect(results[0].message).toContain('Bit position 8 exceeds field size (8 bits)');
    });

    it('should detect invalid bit ranges (high < low)', () => {
      const invalidSpec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 2,
        map: {
          value: {
            bits: [3, 5],
            type: 'uint'
          } // high < low
        }
      } as const;

      const results = bitmaskCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.ERROR);
      expect(results[0].code).toBe('INVALID_BIT_RANGE');
      expect(results[0].message).toContain('[3, 5] has high < low');
    });

    it('should detect too many enum values for bit width', () => {
      const invalidSpec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          status: {
            bits: [1, 0], // 2 bits = max 4 values
            type: 'enum',
            values: ['a', 'b', 'c', 'd', 'e'] // 5 values
          }
        }
      } as any;

      const results = bitmaskCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.ERROR);
      expect(results[0].code).toBe('TOO_MANY_ENUM_VALUES');
      expect(results[0].message).toContain('Too many enum values (5) for 2 bits (max 4)');
    });

    it('should detect bit range positions out of bounds', () => {
      const invalidSpec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1, // Only 8 bits available (0-7)
        map: {
          value: {
            bits: [10, 8],
            type: 'uint'
          } // Both positions out of range
        }
      } as const;

      const results = bitmaskCodec.validate!(invalidSpec, 'test', reg.resolver());
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('BIT_OUT_OF_RANGE');
      expect(results[0].message).toContain('Bit position 10 exceeds field size (8 bits)');
    });
  });

  describe('validateData', () => {
    it('should pass validation for valid bitmask data', () => {
      const spec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 2,
        map: {
          enabled: {
            bits: 0,
            type: 'boolean'
          },
          priority: {
            bits: [7, 4],
            type: 'uint'
          },
          status: {
            bits: [11, 8],
            type: 'enum',
            values: ['idle', 'active', 'pending', 'error']
          }
        }
      };

      const validData = {
        enabled: true,
        priority: 5,
        status: 'active'
      };

      const results = bitmaskCodec.validateData!(spec as any, validData, 'config.flags', reg.resolver());
      expect(results).toHaveLength(0);
    });

    it('should detect invalid bitmask data type with correct path', () => {
      const spec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          flag: {
            bits: 0,
            type: 'boolean'
          }
        }
      };

      const results = bitmaskCodec.validateData!(spec as any, 'not-an-object', 'data.flags', reg.resolver());
      const fatalErrors = results.filter(r => r.level === ValidationLevel.FATAL);

      expect(fatalErrors).toHaveLength(1);
      expect(fatalErrors[0].code).toBe('INVALID_BITMASK_DATA_TYPE');
      expect(fatalErrors[0].message).toContain('Expected object');
      expect(fatalErrors[0].path).toBe('data.flags');
    });

    it('should detect invalid boolean field with correct path', () => {
      const spec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          enabled: {
            bits: 0,
            type: 'boolean'
          }
        }
      };

      const invalidData = {
        enabled: 'yes'
      };

      const results = bitmaskCodec.validateData!(spec as any, invalidData, 'root.flags', reg.resolver());
      const errors = results.filter(r => r.level === ValidationLevel.ERROR);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_BOOLEAN_FIELD');
      expect(errors[0].message).toContain('Expected boolean');
      expect(errors[0].path).toBe('root.flags.enabled');
    });

    it('should detect uint value out of range with correct path', () => {
      const spec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          value: {
            bits: [2, 0], // 3 bits = max value 7
            type: 'uint'
          }
        }
      };

      const invalidData = {
        value: 8 // Exceeds 3-bit range
      };

      const results = bitmaskCodec.validateData!(spec as any, invalidData, 'packet.header.flags', reg.resolver());
      const errors = results.filter(r => r.level === ValidationLevel.ERROR);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('VALUE_OUT_OF_RANGE');
      expect(errors[0].message).toContain('exceeds maximum 7');
      expect(errors[0].path).toBe('packet.header.flags.value');
    });

    it('should detect invalid enum value with correct path', () => {
      const spec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          status: {
            bits: [2, 0],
            type: 'enum',
            values: ['idle', 'active', 'pending']
          }
        }
      };

      const invalidData = {
        status: 'invalid'
      };

      const results = bitmaskCodec.validateData!(spec as any, invalidData, 'system.status.flags', reg.resolver());
      const errors = results.filter(r => r.level === ValidationLevel.ERROR);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_ENUM_VALUE');
      expect(errors[0].message).toContain('Invalid enum value');
      expect(errors[0].message).toContain('idle, active, pending');
      expect(errors[0].path).toBe('system.status.flags.status');
    });

    it('should allow optional fields (undefined values)', () => {
      const spec = {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          enabled: {
            bits: 0,
            type: 'boolean'
          },
          priority: {
            bits: [3, 1],
            type: 'uint'
          }
        }
      };

      const partialData = {
        enabled: true
        // priority is undefined/missing
      };

      const results = bitmaskCodec.validateData!(spec as any, partialData, 'config.flags', reg.resolver());
      expect(results).toHaveLength(0);
    });
  });
});
