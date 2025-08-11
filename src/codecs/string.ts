import type { Codec, MetaField } from '../types';
import { rawCodec } from './raw';

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

    const bytes = rawCodec.read(
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
  write: (view, value, spec) => {
    const {
      byteLength,
      byteOffset
    } = spec;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(value);
    const slice = bytes.slice(0, byteLength); // copy data and long auto-truncate
    const target = new Uint8Array(view.buffer, view.byteOffset + byteOffset, slice.length);

    target.fill(0); // set all to 0

    if (slice.length > 0) {
      target.set(slice);
    }
  }
};
