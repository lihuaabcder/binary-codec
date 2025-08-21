import { describe, expect, it } from 'vitest';
import { numberCodec } from '../../src/codecs/number.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { dummyCtx, toPlainView, toView, viewToArray } from '../helper.ts';

describe('number', () => {
  describe('read', () => {
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

  describe('write', () => {
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
  });

  describe('validate', () => {
    it('should pass validation for valid number field specs', () => {
      const validSpecs = [
        {
          name: 'test',
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 1
        },
        {
          name: 'test',
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 2
        },
        {
          name: 'test',
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 4
        },
        {
          name: 'test',
          type: 'number',
          numberType: 'int',
          byteOffset: 0,
          byteLength: 1
        },
        {
          name: 'test',
          type: 'number',
          numberType: 'int',
          byteOffset: 0,
          byteLength: 2
        },
        {
          name: 'test',
          type: 'number',
          numberType: 'int',
          byteOffset: 0,
          byteLength: 4
        },
        {
          name: 'test',
          type: 'number',
          numberType: 'float',
          byteOffset: 0,
          byteLength: 4
        }
      ] as const;

      for (const spec of validSpecs) {
        const results = numberCodec.validate!(spec, 'test', dummyCtx);
        expect(results).toHaveLength(0);
      }
    });

    it('should detect invalid number type/length combinations', () => {
      const invalidSpecs = [
        {
          name: 'test',
          type: 'number' as const,
          numberType: 'uint' as const,
          byteOffset: 0,
          byteLength: 3 as any
        },
        {
          name: 'test',
          type: 'number' as const,
          numberType: 'int' as const,
          byteOffset: 0,
          byteLength: 5 as any
        },
        {
          name: 'test',
          type: 'number' as const,
          numberType: 'float' as const,
          byteOffset: 0,
          byteLength: 1 as any
        },
        {
          name: 'test',
          type: 'number' as const,
          numberType: 'float' as const,
          byteOffset: 0,
          byteLength: 2 as any
        },
        {
          name: 'test',
          type: 'number' as const,
          numberType: 'float' as const,
          byteOffset: 0,
          byteLength: 8 as any
        }
      ];

      for (const spec of invalidSpecs) {
        const results = numberCodec.validate!(spec, 'test', dummyCtx);
        expect(results).toHaveLength(1);
        expect(results[0].level).toBe(ValidationLevel.FATAL);
        expect(results[0].code).toBe('INVALID_NUMBER_TYPE_LENGTH');
        expect(results[0].message).toContain(`${spec.numberType} with ${spec.byteLength} bytes`);
      }
    });
  });
});
