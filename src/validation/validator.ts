import type { CodecRegistry } from '../registry/registry.ts';
import type { CodecSpec, Field } from '../types.ts';
import type { ValidationResult } from './types.ts';
import { ValidationLevel } from './types.ts';

export class ValidationError extends Error {
  constructor(public results: ValidationResult[]) {
    super(`Validation failed with ${results.length} error(s)`);
    this.name = 'ValidationError';
  }
}

/**
 * Static validation of codec spec structure using registry-based codec validators
 */
export function validateCodecSpec(spec: CodecSpec, registry: CodecRegistry): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Basic spec validation
  results.push(...validateBasicSpec(spec));

  // Field-specific validation using codec validators
  spec.fields.forEach((field, index) => {
    const path = `fields[${index}]`;

    // Basic field validation
    results.push(...validateBasicField(field, path, spec));

    // Codec-specific validation
    try {
      const codec = registry.get(field.type);
      if (codec.validate) {
        results.push(...codec.validate(field, path, registry.resolver()));
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (error) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Unknown field type: ${field.type}`,
        path: `${path}.type`,
        code: 'UNKNOWN_FIELD_TYPE'
      });
    }
  });

  // Cross-field validation
  results.push(...validateFieldInteractions(spec.fields));

  return results;
}

function validateBasicSpec(spec: CodecSpec): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!spec.fields || !Array.isArray(spec.fields)) {
    results.push({
      level: ValidationLevel.FATAL,
      message: 'Spec must have a fields array',
      path: 'fields',
      code: 'MISSING_FIELDS'
    });
    return results;
  }

  if (spec.byteLength <= 0) {
    results.push({
      level: ValidationLevel.FATAL,
      message: 'Spec byteLength must be positive',
      path: 'byteLength',
      code: 'INVALID_BYTE_LENGTH'
    });
  }

  return results;
}

function validateBasicField(field: Field, path: string, spec: CodecSpec): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!field.name) {
    results.push({
      level: ValidationLevel.FATAL,
      message: 'Field must have a name',
      path: `${path}.name`,
      code: 'MISSING_FIELD_NAME'
    });
  }

  if (field.byteOffset < 0) {
    results.push({
      level: ValidationLevel.FATAL,
      message: 'Field byteOffset cannot be negative',
      path: `${path}.byteOffset`,
      code: 'NEGATIVE_OFFSET'
    });
  }

  if (field.byteLength <= 0) {
    results.push({
      level: ValidationLevel.FATAL,
      message: 'Field byteLength must be positive',
      path: `${path}.byteLength`,
      code: 'INVALID_FIELD_LENGTH'
    });
  }

  // Check if field exceeds spec bounds
  const fieldEnd = field.byteOffset + field.byteLength;
  if (fieldEnd > spec.byteLength) {
    results.push({
      level: ValidationLevel.FATAL,
      message: `Field extends beyond spec boundary (${fieldEnd} > ${spec.byteLength})`,
      path,
      code: 'FIELD_OUT_OF_BOUNDS'
    });
  }

  return results;
}

function validateFieldInteractions(fields: Field[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check for field overlaps
  for (let i = 0; i < fields.length; i++) {
    for (let j = i + 1; j < fields.length; j++) {
      const field1 = fields[i];
      const field2 = fields[j];

      const field1End = field1.byteOffset + field1.byteLength;
      const field2End = field2.byteOffset + field2.byteLength;

      // Check if fields overlap
      if (field1.byteOffset < field2End && field2.byteOffset < field1End) {
        results.push({
          level: ValidationLevel.WARNING,
          message: `Fields '${field1.name}' and '${field2.name}' overlap`,
          path: `fields[${i}], fields[${j}]`,
          code: 'FIELD_OVERLAP'
        });
      }
    }
  }

  // Check for duplicate field names
  const nameSet = new Set<string>();
  fields.forEach((field, index) => {
    if (nameSet.has(field.name)) {
      results.push({
        level: ValidationLevel.ERROR,
        message: `Duplicate field name: '${field.name}'`,
        path: `fields[${index}].name`,
        code: 'DUPLICATE_FIELD_NAME'
      });
    }
    nameSet.add(field.name);
  });

  return results;
}

/**
 * Runtime validation during deserialization
 * Only checks critical issues that could cause crashes
 */
export function validateRuntime(spec: CodecSpec, buffer: Uint8Array): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Check buffer size
  if (buffer.length < spec.byteLength) {
    results.push({
      level: ValidationLevel.FATAL,
      message: `Buffer too small: got ${buffer.length} bytes, need ${spec.byteLength}`,
      path: 'buffer',
      code: 'BUFFER_TOO_SMALL'
    });
  }

  return results;
}

/**
 * Process validation results based on options
 */
export function processValidationResults(
  results: ValidationResult[],
  throwOnFatal: boolean = true,
  onValidation?: (results: ValidationResult[]) => void
): void {
  if (results.length === 0) {
    return;
  }

  // Call user callback if provided
  if (onValidation) {
    onValidation(results);
  }

  // Check for fatal errors
  const fatalResults = results.filter(r => r.level === ValidationLevel.FATAL);
  if (fatalResults.length > 0 && throwOnFatal) {
    throw new ValidationError(fatalResults);
  }
}
