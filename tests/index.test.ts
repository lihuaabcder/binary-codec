import type { CodecSpec } from '../src/types.ts';
import { describe, expect, it } from 'vitest';
import { arrayCodec } from '../src/codecs/array.ts';
import { bitmaskCodec } from '../src/codecs/bitmask.ts';
import { numberCodec } from '../src/codecs/number.ts';
import { objectCodec } from '../src/codecs/object.ts';
import { rawCodec } from '../src/codecs/raw.ts';
import { stringCodec } from '../src/codecs/string.ts';
import { deserialize, serialize } from '../src/entries/index.ts';
import { createTestRegistry, u8 } from './helper.ts';

describe('deserialize', () => {
  it('should decode with default global regsitry (number + string)', () => {
    const buf = u8([0x2A, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);

    const spec = {
      littleEndian: false,
      byteLength: 6,
      fields: [
        {
          name: 'status',
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 1
        },
        {
          name: 'greeting',
          type: 'string',
          encoding: 'utf-8',
          byteOffset: 1,
          byteLength: 5,
          trimNull: true
        }
      ]
    } as const satisfies CodecSpec;

    const out = deserialize(spec, buf);
    expect(out).toEqual({
      status: 42,
      greeting: 'Hello'
    });
  });

  it('should decode with a custom minimal registry (honors base offset + LE)', () => {
    const buf = u8([0, 0, 0, 0, 0x34, 0x12, 0x4F, 0x4B]);

    const reg = createTestRegistry([
      rawCodec,
      numberCodec,
      stringCodec,
      bitmaskCodec,
      arrayCodec,
      objectCodec
    ]);

    const spec = {
      byteLength: 8,
      littleEndian: true,
      fields: [
        {
          name: 'val',
          type: 'number',
          numberType: 'uint',
          byteLength: 2,
          byteOffset: 4
        },
        {
          name: 'msg',
          type: 'string',
          encoding: 'utf-8',
          byteLength: 2,
          byteOffset: 6,
          trimNull: true
        }
      ]
    } as const satisfies CodecSpec;

    const out = deserialize(spec, buf, reg);
    expect(out).toEqual({
      val: 0x1234,
      msg: 'OK'
    });
  });

  it('should support overriding a codec via custom registry (string -> uppercased)', () => {
    const buf = u8([0x6F, 0x6B, 0x21]); // "ok!"

    const reg = createTestRegistry([
      rawCodec,
      numberCodec,
      bitmaskCodec,
      arrayCodec,
      objectCodec
    ]);

    const upperStringCodec = {
      ...stringCodec,
      read: (view: DataView, spec: any, ctx: any) => {
        const base = stringCodec.read(view, spec, ctx);
        return (base as string).toUpperCase();
      }
    };

    reg.install(upperStringCodec);

    const spec = {
      byteLength: 3,
      fields: [
        {
          name: 'shout',
          type: 'string',
          encoding: 'utf-8',
          byteLength: 3,
          byteOffset: 0,
          trimNull: true
        }
      ]
    } as const satisfies CodecSpec;

    const out = deserialize(spec, buf, reg);
    expect(out).toEqual({
      shout: 'OK!'
    });
  });
});

describe('serialize', () => {
  it('should encode with default global regsitry (number + string)', () => {
    const value = {
      status: 42,
      greeting: 'Hello'
    };

    const spec = {
      littleEndian: false,
      byteLength: 6,
      fields: [
        {
          name: 'status',
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 1
        },
        {
          name: 'greeting',
          type: 'string',
          encoding: 'utf-8',
          byteOffset: 1,
          byteLength: 5,
          trimNull: true
        }
      ]
    } as const satisfies CodecSpec;

    const out = serialize(spec, value);
    expect(out).toEqual(u8([0x2A, 0x48, 0x65, 0x6C, 0x6C, 0x6F]));
  });

  it('should encode with a custom minimal registry (honors base offset + LE)', () => {
    const value = {
      val: 0x1234,
      msg: 'OK'
    };

    const reg = createTestRegistry([
      rawCodec,
      numberCodec,
      stringCodec,
      bitmaskCodec,
      arrayCodec,
      objectCodec
    ]);

    const spec = {
      byteLength: 8,
      littleEndian: true,
      fields: [
        {
          name: 'val',
          type: 'number',
          numberType: 'uint',
          byteLength: 2,
          byteOffset: 4
        },
        {
          name: 'msg',
          type: 'string',
          encoding: 'utf-8',
          byteLength: 2,
          byteOffset: 6,
          trimNull: true
        }
      ]
    } as const satisfies CodecSpec;

    const out = serialize(spec, value, reg);
    expect(out).toEqual(u8([0, 0, 0, 0, 0x34, 0x12, 0x4F, 0x4B]));
  });

  it('should support overriding a codec via custom registry (string -> uppercased)', () => {
    const value = {
      shout: 'OK!'
    };

    const reg = createTestRegistry([
      rawCodec,
      numberCodec,
      bitmaskCodec,
      arrayCodec,
      objectCodec
    ]);

    const upperStringCodec = {
      ...stringCodec,
      write: (view: DataView, spec: any, val: any) => {
        const {
          byteLength,
          byteOffset
        } = spec;

        const encoder = new TextEncoder();
        const bytes = encoder.encode(val.toLowerCase());
        const slice = bytes.slice(0, byteLength); // copy data and long auto-truncate
        const target = new Uint8Array(view.buffer, view.byteOffset + byteOffset, byteLength);

        target.fill(0); // set all to 0

        if (slice.length > 0) {
          target.set(slice);
        }
      }
    };

    reg.install(upperStringCodec);

    const spec = {
      byteLength: 3,
      fields: [
        {
          name: 'shout',
          type: 'string',
          encoding: 'utf-8',
          byteLength: 3,
          byteOffset: 0,
          trimNull: true
        }
      ]
    } as const satisfies CodecSpec;

    const out = serialize(spec, value, reg);
    expect(out).toEqual(u8([0x6F, 0x6B, 0x21]));
  });
});
