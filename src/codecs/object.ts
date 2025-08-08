import type { Codec, MetaField, SpecFields } from '../types';
import { registry } from '../registry';

export type ObjectField = MetaField<'object'> & SpecFields;

export const objectCodec: Codec<ObjectField, Record<string, any>> = {
  type: 'object',
  read: (view, spec) => {
    const result: Record<string, any> = {};
    const {
      byteOffset: BaseByteOffset,
      fields,
      littleEndian = false
    } = spec;

    for (const field of fields) {
      const { name, type, byteOffset } = field;
      const codec = registry.get(type);

      const value = codec.read(
        view,
        {
          ...field,
          byteOffset: BaseByteOffset + byteOffset,
          littleEndian
        }
      );

      result[name] = value;
    }

    return result;
  }
};
