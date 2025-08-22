import type { Codec, MetaField, SpecFields } from '../types.ts';
import type { ValidationResult } from '../validation/types.ts';
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
  },
  validateData: (spec, data, path, ctx) => {
    const results: ValidationResult[] = [];

    if (typeof data !== 'object' || data === null) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Expected object for object field, got ${typeof data}`,
        path,
        code: 'INVALID_OBJECT_DATA_TYPE'
      });
      return results;
    }

    const dataObj = data as Record<string, any>;
    const { fields } = spec;

    // Validate each field
    fields.forEach(field => {
      const fieldPath = path ? `${path}.${field.name}` : field.name;
      const fieldValue = dataObj[field.name];

      if (fieldValue === undefined) {
        // Field is missing - this might be a warning or error depending on requirements
        results.push({
          level: ValidationLevel.WARNING,
          message: `Missing field '${field.name}' in object data`,
          path: fieldPath,
          code: 'MISSING_OBJECT_FIELD_DATA'
        });
        return;
      }

      // Recursively validate field data using its codec
      try {
        const codec = ctx.get(field.type);
        if (codec.validateData) {
          const fieldValidationResults = codec.validateData(field, fieldValue, fieldPath, ctx);
          results.push(...fieldValidationResults);
        }
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_error) {
        results.push({
          level: ValidationLevel.FATAL,
          message: `Unknown field type for data validation: ${field.type}`,
          path: `${fieldPath}.type`,
          code: 'UNKNOWN_FIELD_TYPE_DATA'
        });
      }
    });

    // Check for extra fields in data that are not in the spec
    Object.keys(dataObj).forEach(key => {
      if (!fields.some(field => field.name === key)) {
        results.push({
          level: ValidationLevel.INFO,
          message: `Extra field '${key}' in object data not defined in spec`,
          path: path ? `${path}.${key}` : key,
          code: 'EXTRA_OBJECT_FIELD_DATA'
        });
      }
    });

    return results;
  }
};
