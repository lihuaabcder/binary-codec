import type { Codec, Field, MetaField } from '../types';
import { ValidationLevel } from '../validation/types';

export type ArrayField = MetaField<'array'> & {
  item: ArrayItemField
};

export type NonArrayField = Exclude<Field, ArrayField>;

export type ArrayItemField = NonArrayField extends infer U
  ? U extends any
    ? Omit<U, 'name' | 'byteOffset'>
    : never
  : never;

export const arrayCodec: Codec<ArrayField, unknown[]> = {
  type: 'array',
  read: (view, spec, ctx) => {
    const result: unknown[] = [];
    const { byteOffset, byteLength, item } = spec;

    const { byteLength: itemByteLength } = item;
    const length = byteLength / itemByteLength;

    for (let i = 0; i < length; i++) {
      const itemByteOffset = byteOffset + i * itemByteLength;
      const codec = ctx.get(item.type);
      result.push(
        codec.read(
          view,
          {
            ...item,
            byteOffset: itemByteOffset
          },
          ctx
        )
      );
    }

    return result;
  },
  write: (view, spec, value, ctx) => {
    const { byteOffset, byteLength, item } = spec;
    const { byteLength: itemByteLength } = item;

    const length = byteLength / itemByteLength;

    for (let i = 0; i < length; i++) {
      const itemByteOffset = byteOffset + i * itemByteLength;
      const codec = ctx.get(item.type);
      codec.write!(
        view,
        {
          ...item,
          byteOffset: itemByteOffset
        },
        value[i],
        ctx
      );
    }
  },
  validate: (spec, path, ctx) => {
    const results = [];
    const { byteLength, item } = spec;

    if (!item) {
      results.push({
        level: ValidationLevel.FATAL,
        message: 'Array field must have an item specification',
        path: `${path}.item`,
        code: 'MISSING_ARRAY_ITEM'
      });
      return results;
    }

    if (!item.byteLength || item.byteLength <= 0) {
      results.push({
        level: ValidationLevel.FATAL,
        message: 'Array item must have a positive byteLength',
        path: `${path}.item.byteLength`,
        code: 'INVALID_ARRAY_ITEM_LENGTH'
      });
      return results;
    }

    // Check if array length is evenly divisible by item length
    if (byteLength % item.byteLength !== 0) {
      results.push({
        level: ValidationLevel.WARNING,
        message: `Array byteLength (${byteLength}) is not evenly divisible by item byteLength (${item.byteLength})`,
        path,
        code: 'ARRAY_LENGTH_NOT_DIVISIBLE'
      });
    }

    // Validate the item type using its codec
    try {
      const codec = ctx.get(item.type);
      if (codec.validate) {
        // Create a mock field spec for the item to validate
        const itemFieldSpec = {
          name: 'arrayItem',
          ...item
        };
        const itemValidationResults = codec.validate(itemFieldSpec as any, '', ctx);
        // Adjust paths to be relative to this array field
        const adjustedResults = itemValidationResults.map(result => ({
          ...result,
          path: result.path ? `${path}.item${result.path}` : `${path}.item`
        }));
        results.push(...adjustedResults);
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (error) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Unknown array item type: ${item.type}`,
        path: `${path}.item.type`,
        code: 'UNKNOWN_ARRAY_ITEM_TYPE'
      });
    }

    return results;
  },
  validateData: (spec, data, path, ctx) => {
    const results = [];

    if (!Array.isArray(data)) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Expected array for array field, got ${typeof data}`,
        path,
        code: 'INVALID_ARRAY_DATA_TYPE'
      });
      return results;
    }

    const { byteLength, item } = spec;
    const { byteLength: itemByteLength } = item;
    const expectedLength = byteLength / itemByteLength;

    // Check array length
    if (data.length !== expectedLength) {
      results.push({
        level: ValidationLevel.ERROR,
        message: `Array length mismatch: expected ${expectedLength}, got ${data.length}`,
        path,
        code: 'ARRAY_LENGTH_MISMATCH'
      });
    }

    // Validate each array item
    data.forEach((itemData, index) => {
      const itemPath = `${path}[${index}]`;
      try {
        const codec = ctx.get(item.type);
        if (codec.validateData) {
          // Create a mock field spec for the item to validate
          const itemFieldSpec = {
            name: 'arrayItem',
            ...item
          };
          const itemValidationResults = codec.validateData(itemFieldSpec as any, itemData, itemPath, ctx);
          results.push(...itemValidationResults);
        }
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_error) {
        results.push({
          level: ValidationLevel.FATAL,
          message: `Unknown array item type for data validation: ${item.type}`,
          path: itemPath,
          code: 'UNKNOWN_ARRAY_ITEM_TYPE_DATA'
        });
      }
    });

    return results;
  }
};
