import type { BitmaskMap } from '../../src/codecs/bitmask';
import { describe, expect, it } from 'vitest';
import { bitmaskCodec } from '../../src/codecs/bitmask';
import { numberCodec } from '../../src/codecs/number';
import { createTestRegistry, toPlainView, toView, viewToArray } from '../helper';

const reg = createTestRegistry([numberCodec]);

describe('bitmask.read', () => {
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

describe('bitmask.write', () => {
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
