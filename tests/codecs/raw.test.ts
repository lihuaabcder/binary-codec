import { describe, expect, it } from 'vitest';
import { rawCodec } from '../../src/codecs/raw.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { dummyCtx, toPlainView, toView, viewToArray } from '../helper.ts';

describe('raw', () => {
  describe('read', () => {
    it('should extract correct bytes from buffer', () => {
      const view = toView([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);

      const result = rawCodec.read(
        view,
        {
          byteOffset: 2,
          byteLength: 3
        },
        dummyCtx
      );

      expect(Array.from(result)).toEqual([0xCC, 0xDD, 0xEE]);
    });

    it('should return empty array if length is zero', () => {
      const buffer = new ArrayBuffer(6);
      const view = new DataView(buffer);
      const result = rawCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 0
        },
        dummyCtx
      );
      expect(result.length).toBe(0);
      expect(Array.from(result)).toEqual([]);
    });

    it('should mutate the original buffer', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      const raw = rawCodec.read(
        view,
        {
          byteOffset: 1,
          byteLength: 2
        },
        dummyCtx
      );
      raw[0] = 0x99;
      expect(view.getUint8(1)).toBe(0x99);
    });

    it('should throw if offset out of range', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      expect(() => rawCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 5
        },
        dummyCtx
      )).toThrow(RangeError);
    });
  });

  describe('write', () => {
    it('should write Uint8Array data at the correct offset', () => {
      const view = toPlainView(6);

      const value = new Uint8Array([0xCC, 0xDD, 0xEE]);

      rawCodec.write!(
        view,
        {
          byteOffset: 2,
          byteLength: 3
        },
        value,
        dummyCtx
      );

      const arr = viewToArray(view);
      expect(arr.slice(0, 2)).toEqual([0, 0]);
      expect(arr.slice(2, 5)).toEqual(Array.from(value));
      expect(arr.slice(5, 6)).toEqual([0]);
    });

    it('should throw if value out of range', () => {
      const view = toPlainView(3);
      const value = new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD, 0xEE]);

      expect(
        () => rawCodec.write!(
          view,
          {
            byteOffset: 0,
            byteLength: 3
          },
          value,
          dummyCtx
        )
      ).toThrow(RangeError);
    });
  });

  describe('validate', () => {
    it('should pass validation for valid raw field specs', () => {
      const validSpec = {
        name: 'test',
        type: 'raw',
        byteOffset: 0,
        byteLength: 10
      } as const;

      const results = rawCodec.validate!(validSpec, 'test', dummyCtx);
      expect(results).toHaveLength(0);
    });

    it('should detect invalid byteLength', () => {
      const invalidSpecs = [
        {
          name: 'test',
          type: 'raw',
          byteOffset: 0,
          byteLength: 0
        },
        {
          name: 'test',
          type: 'raw',
          byteOffset: 0,
          byteLength: -1
        }
      ] as any[];

      for (const spec of invalidSpecs) {
        const results = rawCodec.validate!(spec, 'test', dummyCtx);
        expect(results).toHaveLength(1);
        expect(results[0].level).toBe(ValidationLevel.FATAL);
        expect(results[0].code).toBe('INVALID_RAW_LENGTH');
      }
    });
  });

  describe('validateData', () => {
    it('should pass validation for valid raw data', () => {
      const spec = {
        name: 'bytes',
        type: 'raw',
        byteOffset: 0,
        byteLength: 4
      };

      const validData = new Uint8Array([1, 2, 3, 4]);
      const results = rawCodec.validateData!(spec as any, validData, 'packet.bytes', dummyCtx);
      expect(results).toHaveLength(0);
    });

    it('should detect invalid raw data type with correct path', () => {
      const spec = {
        name: 'bytes',
        type: 'raw',
        byteOffset: 0,
        byteLength: 4
      };

      const results = rawCodec.validateData!(spec as any, [1, 2, 3, 4], 'data.raw.bytes', dummyCtx);
      const fatalErrors = results.filter(r => r.level === ValidationLevel.FATAL);

      expect(fatalErrors).toHaveLength(1);
      expect(fatalErrors[0].code).toBe('INVALID_RAW_DATA_TYPE');
      expect(fatalErrors[0].message).toContain('Expected Uint8Array');
      expect(fatalErrors[0].path).toBe('data.raw.bytes');
    });

    it('should detect raw data length mismatch with correct path', () => {
      const spec = {
        name: 'bytes',
        type: 'raw',
        byteOffset: 0,
        byteLength: 4
      };

      const invalidData = new Uint8Array([1, 2]); // Wrong length
      const results = rawCodec.validateData!(spec as any, invalidData, 'header.checksum', dummyCtx);
      const errors = results.filter(r => r.level === ValidationLevel.ERROR);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('RAW_DATA_LENGTH_MISMATCH');
      expect(errors[0].message).toContain('expected 4, got 2');
      expect(errors[0].path).toBe('header.checksum');
    });
  });
});
