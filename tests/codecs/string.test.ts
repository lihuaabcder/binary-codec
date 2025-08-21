import { describe, expect, it } from 'vitest';
import { rawCodec } from '../../src/codecs/raw.ts';
import { stringCodec } from '../../src/codecs/string.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { createTestRegistry, dummyCtx, toPlainView, toView, viewToArray } from '../helper.ts';

const reg = createTestRegistry([rawCodec]);

describe('string', () => {
  describe('read', () => {
    it('should decode basic ASCII string', () => {
      const view = toView([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
      const str = stringCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 5,
          encoding: 'utf-8',
          trimNull: true
        },
        reg.resolver()
      );
      expect(str).toBe('Hello');
    });

    it('should trim null characters at end if trimNull is truthy', () => {
      const view = toView([0x41, 0x42, 0x43, 0x00, 0x00, 0x00]);
      const str = stringCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 6,
          encoding: 'utf-8',
          trimNull: true
        },
        reg.resolver()
      );
      expect(str).toBe('ABC');
    });

    it('should retain null characters at end if trimNull is falsy', () => {
      const view = toView([0x41, 0x42, 0x43, 0x00, 0x00, 0x00]);
      const str = stringCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 6,
          encoding: 'utf-8',
          trimNull: false
        },
        reg.resolver()
      );
      expect(str).toBe('ABC\u0000\u0000\u0000');
    });

    it('decodes UTF-8 multibyte characters', () => {
      const utf8 = new TextEncoder().encode('你好');
      const buffer = utf8.buffer;
      const view = new DataView(buffer);
      const str = stringCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: utf8.length,
          encoding: 'utf-8'
        },
        reg.resolver()
      );
      expect(str).toBe('你好');
    });

    it('replaces invalid utf-8 bytes with �', () => {
      const view = toView([0xFF, 0xFF, 0x61]);
      const str = stringCodec.read(
        view,
        {
          byteOffset: 0,
          byteLength: 3,
          encoding: 'utf-8',
          trimNull: true
        },
        reg.resolver()
      );
      expect(str).toBe('\uFFFD\uFFFDa');
    });
  });

  describe('write', () => {
    it('should encode basic ASCII string', () => {
      const view = toPlainView(5);
      const value = 'Hello';

      stringCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 5
        },
        value,
        reg
      );

      expect(viewToArray(view)).toEqual([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
    });

    it('should trucate when value is longer than byteLength', () => {
      const view = toPlainView(4);
      const value = 'Hello';

      stringCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 4
        },
        value,
        reg
      );

      expect(viewToArray(view)).toEqual([0x48, 0x65, 0x6C, 0x6C]);
    });

    it('should overwrite existing bytes and zero-fill the entire field', () => {
      const view = toPlainView(6);
      const value = 'Hello';

      stringCodec.write!(
        view,
        {
          byteOffset: 0,
          byteLength: 6
        },
        value,
        reg
      );

      expect(viewToArray(view)).toEqual([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00]);
    });
  });

  describe('validate', () => {
    it('should pass validation for valid string field specs', () => {
      const validSpec = {
        name: 'test',
        type: 'string',
        byteOffset: 0,
        byteLength: 10,
        encoding: 'utf-8'
      } as const;

      const results = stringCodec.validate!(validSpec, 'test', dummyCtx);
      expect(results).toHaveLength(0);
    });

    it('should detect invalid encoding', () => {
      const invalidSpec = {
        name: 'test',
        type: 'string',
        byteOffset: 0,
        byteLength: 10,
        encoding: 'invalid-encoding'
      } as any;

      const results = stringCodec.validate!(invalidSpec, 'test', dummyCtx);
      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.ERROR);
      expect(results[0].code).toBe('INVALID_ENCODING');
    });

    it('should pass validation when no encoding specified', () => {
      const validSpec = {
        name: 'test',
        type: 'string',
        byteOffset: 0,
        byteLength: 10
      } as const;

      const results = stringCodec.validate!(validSpec, 'test', dummyCtx);
      expect(results).toHaveLength(0);
    });
  });
});
