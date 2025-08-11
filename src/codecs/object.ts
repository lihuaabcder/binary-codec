import type { Codec, MetaField, SpecFields } from '../types';

export type ObjectField = MetaField<'object'> & SpecFields;

export const objectCodec: Codec<ObjectField, Record<string, any>> = {
  type: 'object',
  read: (view, spec, ctx) => {
    const result: Record<string, any> = {};
    const {
      byteOffset: BaseByteOffset,
      fields,
      littleEndian = false
    } = spec;

    for (const field of fields) {
      const { name, type, byteOffset } = field;
      const codec = ctx.get(type);

      const value = codec.read(
        view,
        {
          ...field,
          byteOffset: BaseByteOffset + byteOffset,
          littleEndian
        },
        ctx
      );

      result[name] = value;
    }

    return result;
  }
};
