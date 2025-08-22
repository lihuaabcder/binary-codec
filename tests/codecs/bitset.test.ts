import { describe, expect, it } from 'vitest';
import { bitsetCodec } from '../../src/codecs/bitset.ts';
import { numberCodec } from '../../src/codecs/number.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { createTestRegistry, dummyCtx, toPlainView, toView, viewToArray } from '../helper.ts';

const reg = createTestRegistry([numberCodec]);

describe('bitset', () => {
  describe('read', () => {
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

  describe('write', () => {
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

  describe('validate', () => {
    it('should pass validation for valid bitset field specs', () => {
      const validSpec = {
        name: 'test',
        type: 'bitset',
        byteOffset: 0,
        byteLength: 4
      } as const;

      const results = bitsetCodec.validate!(validSpec, 'test', dummyCtx);
      expect(results).toHaveLength(0);
    });

    it('should detect invalid byteLength', () => {
      const invalidSpecs = [
        {
          name: 'test',
          type: 'bitset',
          byteOffset: 0,
          byteLength: 0
        },
        {
          name: 'test',
          type: 'bitset',
          byteOffset: 0,
          byteLength: -1
        }
      ] as any[];

      for (const spec of invalidSpecs) {
        const results = bitsetCodec.validate!(spec, 'test', dummyCtx);
        expect(results).toHaveLength(1);
        expect(results[0].level).toBe(ValidationLevel.FATAL);
        expect(results[0].code).toBe('INVALID_BITSET_LENGTH');
      }
    });
  });

  describe('validateData', () => {
    it('should pass validation for valid bitset data', () => {
      const spec = {
        name: 'bits',
        type: 'bitset',
        byteOffset: 0,
        byteLength: 2
      };

      const validData = Array.from({
        length: 16
      }).fill(false).map((_, i) => i % 2 === 0);
      const results = bitsetCodec.validateData!(spec as any, validData, 'config.bits', reg.resolver());
      expect(results).toHaveLength(0);
    });

    it('should detect invalid bitset data type with correct path', () => {
      const spec = {
        name: 'bits',
        type: 'bitset',
        byteOffset: 0,
        byteLength: 1
      };

      const results = bitsetCodec.validateData!(spec as any, 'not-an-array', 'data.bits', reg.resolver());
      const fatalErrors = results.filter(r => r.level === ValidationLevel.FATAL);

      expect(fatalErrors).toHaveLength(1);
      expect(fatalErrors[0].code).toBe('INVALID_BITSET_DATA_TYPE');
      expect(fatalErrors[0].message).toContain('Expected array');
      expect(fatalErrors[0].path).toBe('data.bits');
    });

    it('should detect bitset length mismatch with correct path', () => {
      const spec = {
        name: 'bits',
        type: 'bitset',
        byteOffset: 0,
        byteLength: 1
      };

      const invalidData = [true, false]; // Should have 8 elements for 1 byte
      const results = bitsetCodec.validateData!(spec as any, invalidData, 'packet.flags', reg.resolver());
      const errors = results.filter(r => r.level === ValidationLevel.ERROR);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('BITSET_LENGTH_MISMATCH');
      expect(errors[0].message).toContain('expected 8, got 2');
      expect(errors[0].path).toBe('packet.flags');
    });

    it('should detect invalid bitset element types with correct path', () => {
      const spec = {
        name: 'bits',
        type: 'bitset',
        byteOffset: 0,
        byteLength: 1
      };

      const invalidData = [true, false, 'invalid', true, false, true, false, true];
      const results = bitsetCodec.validateData!(spec as any, invalidData, 'header.control.bits', reg.resolver());
      const errors = results.filter(r => r.level === ValidationLevel.ERROR);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('INVALID_BITSET_ELEMENT_TYPE');
      expect(errors[0].message).toContain('Expected boolean at index 2');
      expect(errors[0].path).toBe('header.control.bits[2]');
    });
  });
});
