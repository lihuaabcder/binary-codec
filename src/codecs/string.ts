import type { Codec, MetaField } from '../types.ts';
import type { RawField } from './raw.ts';
import { ValidationLevel } from '../validation/types.ts';

// TODO encoding...
export type StringField = MetaField<'string'> & {
  encoding?: string
  trimNull?: boolean
};

export const stringCodec: Codec<StringField, string> = {
  type: 'string',
  read: (view, spec, ctx) => {
    const {
      byteLength,
      byteOffset,
      encoding = 'utf-8',
      trimNull = true
    } = spec;

    const decoder = new TextDecoder(
      encoding,
      {
        fatal: false,
        ignoreBOM: false // TODO: BOM compatible
      }
    );

    const bytes = ctx.get<RawField, Uint8Array>('raw').read(
      view,
      {
        byteOffset,
        byteLength
      },
      ctx
    );
    const text = decoder.decode(bytes);
    return trimNull ? text.replace(/\0+$/, '') : text;
  },
  write: (view, spec, value) => {
    const {
      byteLength,
      byteOffset
    } = spec;

    // todo use raw write?
    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    const slice = bytes.slice(0, byteLength); // copy data and long auto-truncate
    const target = new Uint8Array(view.buffer, view.byteOffset + byteOffset, byteLength);

    target.fill(0); // set all to 0

    if (slice.length > 0) {
      target.set(slice);
    }
  },
  validate: (spec, path, _ctx) => {
    const results = [];
    const { encoding } = spec;

    if (encoding) {
      try {
        new TextDecoder(encoding);
      } catch (error) {
        results.push({
          level: ValidationLevel.ERROR,
          message: `Invalid encoding: ${encoding}`,
          path,
          code: 'INVALID_ENCODING'
        });
      }
    }

    return results;
  }
};
