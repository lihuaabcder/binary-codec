import type { CodecSpec } from '../src/types';
import { describe, expect, it } from 'vitest';
import { deserialize } from '../src';
import { createTestRegistry, u8 } from './helper';
import { arrayCodec } from '../src/codecs/array';
import { bitmaskCodec } from '../src/codecs/bitmask';
import { numberCodec } from '../src/codecs/number';
import { objectCodec } from '../src/codecs/object';
import { rawCodec } from '../src/codecs/raw';
import { stringCodec } from '../src/codecs/string';

describe('deserialize', () => {
  it('should read with default global regsitry (number + string)', () => {
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

    const out = deserialize(buf, spec);
    expect(out).toEqual({
      status: 42,
      greeting: 'Hello'
    });
  });

  it('should decodes with a custom minimal registry (honors base offset + LE)', () => {
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
        { name: 'val', type: 'number', numberType: 'uint', byteLength: 2, byteOffset: 4 },
        { name: 'msg', type: 'string', encoding: 'utf-8', byteLength: 2, byteOffset: 6, trimNull: true },
      ],
    } as const satisfies CodecSpec;

    const out = deserialize(buf, spec, reg);
    expect(out).toEqual({ val: 0x1234, msg: 'OK' });
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
      },
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
        },
      ],
    } as const satisfies CodecSpec;

    const out = deserialize(buf, spec, reg);
    expect(out).toEqual({ shout: 'OK!' });
  });
});
