import type { CodecRegistry } from '../registry/registry';
import type { CodecSpec, Field } from '../types';
import type { ValidationLogger, ValidationResult } from './types';
import { ValidationLevel } from './types';

export class ValidationError extends Error {
  constructor(message: string, public results: ValidationResult[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ========================================
// STATIC CONFIGURATION VALIDATION
// ========================================

/**
 * Static validation of codec spec structure using registry-based codec validators
 * Checks configuration correctness without requiring actual data
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

// ========================================
// RUNTIME DATA VALIDATION
// ========================================

/**
 * Runtime validation of actual data against codec specification
 * Checks if data conforms to the configuration requirements
 */
export function validateRuntimeData(
  spec: CodecSpec | Field,
  data: unknown,
  registry: CodecRegistry,
  path: string = ''
): ValidationResult[] {
  // For CodecSpec, validate as object field
  if ('fields' in spec) {
    const objectCodec = registry.get('object');
    if (objectCodec.validateData) {
      return objectCodec.validateData(spec as any, data, path, registry.resolver());
    }
    return [];
  }

  // For individual Field, delegate to specific codec
  const field = spec as Field;
  try {
    const codec = registry.get(field.type);
    if (codec.validateData) {
      return codec.validateData(field as any, data, path, registry.resolver());
    }
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (_error) {
    return [{
      level: ValidationLevel.FATAL,
      message: `Unknown field type for data validation: ${field.type}`,
      path: `${path}.type`,
      code: 'UNKNOWN_FIELD_TYPE_DATA'
    }];
  }

  return [];
}

/**
 * Buffer size validation during deserialization
 * Checks if buffer is large enough for the operation
 */
export function validateBufferSize(spec: CodecSpec, buffer: Uint8Array): ValidationResult[] {
  const results: ValidationResult[] = [];

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

// ========================================
// VALIDATION RESULT PROCESSING
// ========================================

/**
 * Process validation results based on options
 */

const defaultLogger: ValidationLogger = {
  log: (level, result) => {
    switch (level) {
      case ValidationLevel.FATAL:
        console.error(`[FATAL] ${result.code} @ ${result.path} - ${result.message}`);
        break;
      case ValidationLevel.ERROR:
        console.error(`[ERROR] ${result.code} @ ${result.path} - ${result.message}`);
        break;
      case ValidationLevel.WARNING:
        console.warn(`[WARN] ${result.code} @ ${result.path} - ${result.message}`);
        break;
      default:
        console.info(`[INFO] ${result.code} @ ${result.path} - ${result.message}`);
    }
  }
};

export function processValidationResults(
  results: ValidationResult[],
  throwOnFatal: boolean = true,
  onValidation?: (results: ValidationResult[]) => void,
  logger: ValidationLogger = defaultLogger
): void {
  if (results.length === 0) {
    return;
  }

  // Call user callback if provided
  if (onValidation) {
    onValidation(results);
  }

  results.forEach(r => {
    logger.log(r.level, r);
  });

  // Check for fatal errors
  const fatalResults = results.filter(r => r.level === ValidationLevel.FATAL);
  if (fatalResults.length > 0 && throwOnFatal) {
    const errorType = fatalResults[0].code?.includes('DATA') ? 'Data validation' : 'Configuration validation';
    throw new ValidationError(`${errorType} failed with ${fatalResults.length} fatal error(s)`, fatalResults);
  }

  // todo log other type error
}
