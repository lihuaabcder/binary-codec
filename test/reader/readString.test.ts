import { describe, expect, it } from 'vitest';
import { readString } from '../../src/reader/readString';
import { toView } from '../helper';

describe('readString', () => {
  it('should decode basic ASCII string', () => {
    const view = toView([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
    const str = readString(view, 0, 5, 'utf-8', true);
    expect(str).toBe('Hello');
  });

  it('should trim null characters at end if trimNull is truthy', () => {
    const view = toView([0x41, 0x42, 0x43, 0x00, 0x00, 0x00]);
    const str = readString(view, 0, 6, 'utf-8', true);
    expect(str).toBe('ABC');
  });

  it('should retain null characters at end if trimNull is falsy', () => {
    const view = toView([0x41, 0x42, 0x43, 0x00, 0x00, 0x00]);
    const str = readString(view, 0, 6, 'utf-8', false);
    expect(str).toBe('ABC\u0000\u0000\u0000');
  });

  it('decodes UTF-8 multibyte characters', () => {
    const utf8 = new TextEncoder().encode('你好');
    const buffer = utf8.buffer;
    const view = new DataView(buffer);
    const str = readString(view, 0, utf8.length, 'utf-8', true);
    expect(str).toBe('你好');
  });

  it('replaces invalid utf-8 bytes with �', () => {
    const view = toView([0xFF, 0xFF, 0x61]);
    const str = readString(view, 0, 3, 'utf-8', true);
    expect(str).toBe('\uFFFD\uFFFDa');
  });
});