import type { Codec, MetaField, SpecFields } from '../types.ts';
import { ValidationLevel } from '../validation/types.ts';

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
  },
  validate: (spec, path, ctx) => {
    const results = [];
    const { fields, byteLength } = spec;

    if (!fields || !Array.isArray(fields)) {
      results.push({
        level: ValidationLevel.FATAL,
        message: 'Object field must have a fields array',
        path: `${path}.fields`,
        code: 'MISSING_OBJECT_FIELDS'
      });
      return results;
    }

    if (fields.length === 0) {
      results.push({
        level: ValidationLevel.WARNING,
        message: 'Object field has empty fields array',
        path: `${path}.fields`,
        code: 'EMPTY_OBJECT_FIELDS'
      });
    }

    // Check if any field extends beyond object bounds
    fields.forEach((field, index) => {
      const fieldEnd = field.byteOffset + field.byteLength;
      if (fieldEnd > byteLength) {
        results.push({
          level: ValidationLevel.FATAL,
          message: `Object field '${field.name}' extends beyond object boundary (${fieldEnd} > ${byteLength})`,
          path: `${path}.fields[${index}]`,
          code: 'OBJECT_FIELD_OUT_OF_BOUNDS'
        });
      }

      // Recursively validate each field using its codec
      try {
        const codec = ctx.get(field.type);
        if (codec.validate) {
          const fieldValidationResults = codec.validate(field, '', ctx);
          // Adjust paths to be relative to this object field
          const adjustedResults = fieldValidationResults.map(result => ({
            ...result,
            path: result.path ? `${path}.fields[${index}]${result.path}` : `${path}.fields[${index}]`
          }));
          results.push(...adjustedResults);
        }
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (error) {
        results.push({
          level: ValidationLevel.FATAL,
          message: `Unknown field type: ${field.type}`,
          path: `${path}.fields[${index}].type`,
          code: 'UNKNOWN_FIELD_TYPE'
        });
      }
    });

    return results;
  }
};
