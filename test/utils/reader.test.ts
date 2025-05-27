import { describe, expect, it } from 'vitest';
import { readRaw, readString } from '../../src/utils/reader';

describe('readRaw', () => {
  it('should extract correct bytes from buffer', () => {
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);

    const result = readRaw(view, 2, 3);

    expect(Array.from(result)).toEqual([0xCC, 0xDD, 0xEE]);
  });

  it('should return empty array if length is zero', () => {
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    const result = readRaw(view, 0, 0);
    expect(result.length).toBe(0);
    expect(Array.from(result)).toEqual([]);
  });

  it('should mutate the original buffer', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    const raw = readRaw(view, 1, 2);
    raw[0] = 0x99;
    expect(view.getUint8(1)).toBe(0x99);
  });

  it('should throw if offset out of range', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    expect(() => readRaw(view, 5)).toThrow(RangeError);
  });
});

describe('readString', () => {
  it('should decode basic ASCII string', () => {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set([0x48, 0x65, 0x6C, 0x6C, 0x6F]);

    const str = readString(view, 0, 5, 'utf-8', true);
    expect(str).toBe('Hello');
  });

  it('should trim null characters at end if trimNull is truthy', () => {
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set([0x41, 0x42, 0x43, 0x00, 0x00, 0x00]);

    const str = readString(view, 0, 6, 'utf-8', true);
    expect(str).toBe('ABC');
  });

  it('should retain null characters at end if trimNull is falsy', () => {
    const buffer = new ArrayBuffer(6);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set([0x41, 0x42, 0x43, 0x00, 0x00, 0x00]);

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
    const bytes = new Uint8Array([0xFF, 0xFF, 0x61]);
    const buffer = bytes.buffer;
    const view = new DataView(buffer);

    const str = readString(view, 0, 3, 'utf-8', true);
    expect(str).toBe('\uFFFD\uFFFDa');
  });
});

// TODO readNumber
