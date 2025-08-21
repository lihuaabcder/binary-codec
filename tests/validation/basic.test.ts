import type { CodecSpec } from '../../src/types.ts';
import { describe, expect, it } from 'vitest';
import { getDefaultRegistry } from '../../src/registry/default.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { validateCodecSpec, ValidationError } from '../../src/validation/validator.ts';

const registry = getDefaultRegistry();

describe('Basic Validation', () => {
  describe('validateCodecSpec', () => {
    it('should pass validation for a valid spec', () => {
      const validSpec = {
        byteLength: 10,
        fields: [
          {
            name: 'id',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          },
          {
            name: 'name',
            type: 'string',
            byteOffset: 4,
            byteLength: 6
          }
        ]
      } as const satisfies CodecSpec;

      const results = validateCodecSpec(validSpec, registry);
      expect(results).toHaveLength(0);
    });

    it('should detect field out of bounds', () => {
      const invalidSpec = {
        byteLength: 5,
        fields: [
          {
            name: 'name',
            type: 'string',
            byteOffset: 4,
            byteLength: 6 // This extends beyond byteLength: 5
          }
        ]
      } as const satisfies CodecSpec;

      const results = validateCodecSpec(invalidSpec, registry);
      const fatalErrors = results.filter(r => r.level === ValidationLevel.FATAL);

      expect(fatalErrors).toHaveLength(1);
      expect(fatalErrors[0].code).toBe('FIELD_OUT_OF_BOUNDS');
      expect(fatalErrors[0].message).toContain('extends beyond spec boundary');
    });

    it('should detect field overlaps', () => {
      const overlappingSpec = {
        byteLength: 10,
        fields: [
          {
            name: 'field1',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          },
          {
            name: 'field2',
            type: 'number',
            numberType: 'uint',
            byteOffset: 2, // Overlaps with field1
            byteLength: 4
          }
        ]
      } as const satisfies CodecSpec;

      const results = validateCodecSpec(overlappingSpec, registry);
      const warnings = results.filter(r => r.level === ValidationLevel.WARNING);

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe('FIELD_OVERLAP');
      expect(warnings[0].message).toContain('field1');
      expect(warnings[0].message).toContain('field2');
    });

    it('should detect duplicate field names', () => {
      const duplicateSpec = {
        byteLength: 10,
        fields: [
          {
            name: 'sameName',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          },
          {
            name: 'sameName', // Duplicate name
            type: 'string',
            byteOffset: 4,
            byteLength: 6
          }
        ]
      } as const satisfies CodecSpec;

      const results = validateCodecSpec(duplicateSpec, registry);
      const errors = results.filter(r => r.level === ValidationLevel.ERROR);

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('DUPLICATE_FIELD_NAME');
      expect(errors[0].message).toContain('sameName');
    });

    it('should detect unknown field types', () => {
      const unknownTypeSpec = {
        byteLength: 10,
        fields: [
          {
            name: 'unknown',
            type: 'nonexistent',
            byteOffset: 0,
            byteLength: 4
          }
        ]
      } as any; // Using any to bypass TypeScript check

      const results = validateCodecSpec(unknownTypeSpec, registry);
      const fatalErrors = results.filter(r => r.level === ValidationLevel.FATAL);

      expect(fatalErrors).toHaveLength(1);
      expect(fatalErrors[0].code).toBe('UNKNOWN_FIELD_TYPE');
      expect(fatalErrors[0].message).toContain('nonexistent');
    });
  });

  describe('ValidationError', () => {
    it('should throw ValidationError for fatal errors', () => {
      const fatalResults = [
        {
          level: ValidationLevel.FATAL,
          message: 'Test fatal error',
          path: 'test',
          code: 'TEST_FATAL'
        }
      ];

      expect(() => {
        throw new ValidationError(fatalResults);
      }).toThrow('Validation failed with 1 error(s)');
    });
  });
});
