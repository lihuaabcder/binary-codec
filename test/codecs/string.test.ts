import { describe, expect, it } from 'vitest';
import { numberCodec } from '../../src/codecs/number';
import { stringCodec } from '../../src/codecs/string';
import { createTestRegistry, toView } from '../helper';

describe('string.read', () => {
  const reg = createTestRegistry([numberCodec]);

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
