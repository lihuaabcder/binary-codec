import type { Codec, MetaField, SpecFields } from '../types.ts';

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
          littleEndian: field.littleEndian !== undefined ? field.littleEndian : littleEndian
        },
        ctx
      );

      result[name] = value;
    }

    return result;
  },
  write: (view, spec, value, ctx) => {
    const {
      byteOffset: BaseByteOffset,
      fields,
      littleEndian = false
    } = spec;

    for (const field of fields) {
      const { name, type, byteOffset } = field;

      if (value[name] === undefined) {
        continue;
      }

      const codec = ctx.get(type);

      codec.write!(
        view,
        {
          ...field,
          byteOffset: BaseByteOffset + byteOffset,
          littleEndian: field.littleEndian !== undefined ? field.littleEndian : littleEndian
        },
        value[name],
        ctx
      );
    }
  }
};
