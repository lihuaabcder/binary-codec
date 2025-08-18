import type { Codec, MetaField } from '../types.ts';

export type RawField = MetaField<'raw'>;

export const rawCodec: Codec<RawField, Uint8Array> = {
  type: 'raw',
  read: (view, spec) => {
    const { byteOffset, byteLength } = spec;
    return new Uint8Array(view.buffer, view.byteOffset + byteOffset, byteLength);
  },
  write: (view, spec, value) => {
    const { byteOffset } = spec;
    new Uint8Array(view.buffer, view.byteOffset + byteOffset, value.length).set(value);
  }
};
