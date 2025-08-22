import type { CodecSpec } from '../../src/types.ts';
import { describe, expect, it } from 'vitest';
import { serialize } from '../../src/entries/index.ts';
import { getDefaultRegistry } from '../../src/registry/default.ts';
import { ValidationLevel } from '../../src/validation/types.ts';
import { processValidationResults, validateCodecSpec, validateRuntimeData, ValidationError } from '../../src/validation/validator.ts';

const registry = getDefaultRegistry();

describe('Validator', () => {
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
        throw new ValidationError('Test validation error', fatalResults);
      }).toThrow('Test validation error');
    });
  });

  describe('validateRuntimeData', () => {
    it('should validate mixed codec types in one spec', () => {
      const spec = {
        byteLength: 20,
        fields: [
          {
            name: 'version',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 2
          },
          {
            name: 'message',
            type: 'string',
            byteOffset: 2,
            byteLength: 8
          },
          {
            name: 'flags',
            type: 'bitmask',
            byteOffset: 10,
            byteLength: 2,
            map: {
              enabled: {
                bits: 0,
                type: 'boolean'
              },
              priority: {
                bits: [7, 4],
                type: 'uint'
              },
              status: {
                bits: [11, 8],
                type: 'enum',
                values: ['idle', 'active']
              }
            }
          },
          {
            name: 'checksum',
            type: 'raw',
            byteOffset: 12,
            byteLength: 4
          },
          {
            name: 'bits',
            type: 'bitset',
            byteOffset: 16,
            byteLength: 4
          }
        ]
      } as const satisfies CodecSpec;

      const validData = {
        version: 1,
        message: 'hello',
        flags: {
          enabled: true,
          priority: 5,
          status: 'active'
        },
        checksum: new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]),
        bits: Array.from({
          length: 32
        }).fill(false)
      };

      const results = validateRuntimeData(spec, validData, registry);
      expect(results).toHaveLength(0);
    });

    it('should collect errors from multiple codecs with correct paths', () => {
      const spec = {
        byteLength: 12,
        fields: [
          {
            name: 'count',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 1
          },
          {
            name: 'title',
            type: 'string',
            byteOffset: 1,
            byteLength: 5
          },
          {
            name: 'flags',
            type: 'bitmask',
            byteOffset: 6,
            byteLength: 1,
            map: {
              active: {
                bits: 0,
                type: 'boolean'
              }
            }
          },
          {
            name: 'data',
            type: 'raw',
            byteOffset: 7,
            byteLength: 4
          },
          {
            name: 'mask',
            type: 'bitset',
            byteOffset: 11,
            byteLength: 1
          }
        ]
      } as const satisfies CodecSpec;

      const invalidData = {
        count: 'not-a-number',
        title: 123,
        flags: 'not-an-object',
        data: [1, 2, 3, 4],
        mask: 'not-an-array'
      };

      const results = validateRuntimeData(spec, invalidData, registry);

      expect(results).toHaveLength(5);

      const fatalErrors = results.filter(r => r.level === ValidationLevel.FATAL);
      expect(fatalErrors).toHaveLength(5);

      // Check that each error has the correct path
      const errorsByField = {
        count: results.find(r => r.path === 'count'),
        title: results.find(r => r.path === 'title'),
        flags: results.find(r => r.path === 'flags'),
        data: results.find(r => r.path === 'data'),
        mask: results.find(r => r.path === 'mask')
      };

      expect(errorsByField.count?.code).toBe('INVALID_NUMBER_DATA_TYPE');
      expect(errorsByField.title?.code).toBe('INVALID_STRING_DATA_TYPE');
      expect(errorsByField.flags?.code).toBe('INVALID_BITMASK_DATA_TYPE');
      expect(errorsByField.data?.code).toBe('INVALID_RAW_DATA_TYPE');
      expect(errorsByField.mask?.code).toBe('INVALID_BITSET_DATA_TYPE');
    });

    it('should handle nested object structures with correct paths', () => {
      const spec = {
        byteLength: 16,
        fields: [
          {
            name: 'header',
            type: 'object',
            byteOffset: 0,
            byteLength: 8,
            fields: [
              {
                name: 'version',
                type: 'number',
                numberType: 'uint',
                byteOffset: 0,
                byteLength: 2
              },
              {
                name: 'config',
                type: 'object',
                byteOffset: 2,
                byteLength: 6,
                fields: [
                  {
                    name: 'flags',
                    type: 'bitmask',
                    byteOffset: 0,
                    byteLength: 2,
                    map: {
                      enabled: {
                        bits: 0,
                        type: 'boolean'
                      }
                    }
                  },
                  {
                    name: 'name',
                    type: 'string',
                    byteOffset: 2,
                    byteLength: 4
                  }
                ]
              }
            ]
          }
        ]
      } as const satisfies CodecSpec;

      const invalidData = {
        header: {
          version: 'invalid',
          config: {
            flags: {
              enabled: 'not-boolean'
            },
            name: 999
          }
        }
      };

      const results = validateRuntimeData(spec, invalidData, registry);

      expect(results.length).toBeGreaterThan(0);

      // Check nested paths
      const versionError = results.find(r => r.path === 'header.version');
      const flagError = results.find(r => r.path === 'header.config.flags.enabled');
      const nameError = results.find(r => r.path === 'header.config.name');

      expect(versionError?.code).toBe('INVALID_NUMBER_DATA_TYPE');
      expect(flagError?.code).toBe('INVALID_BOOLEAN_FIELD');
      expect(nameError?.code).toBe('INVALID_STRING_DATA_TYPE');
    });

    it('should validate array elements with indexed paths', () => {
      const spec = {
        byteLength: 12,
        fields: [
          {
            name: 'numbers',
            type: 'array',
            byteOffset: 0,
            byteLength: 12,
            item: {
              type: 'number',
              numberType: 'uint',
              byteLength: 4
            }
          }
        ]
      } as const satisfies CodecSpec;

      const invalidData = {
        numbers: [1, 'invalid', 3]
      };

      const results = validateRuntimeData(spec, invalidData, registry);

      expect(results.length).toBeGreaterThan(0);

      const indexedError = results.find(r => r.path === 'numbers[1]');
      expect(indexedError?.code).toBe('INVALID_NUMBER_DATA_TYPE');
    });

    it('should handle unknown field types gracefully', () => {
      const spec = {
        byteLength: 4,
        fields: [
          {
            name: 'unknown',
            type: 'nonexistent',
            byteOffset: 0,
            byteLength: 4
          }
        ]
      } as any;

      const data = {
        unknown: 'some-value'
      };

      const results = validateRuntimeData(spec, data, registry);

      expect(results).toHaveLength(1);
      expect(results[0].level).toBe(ValidationLevel.FATAL);
      expect(results[0].code).toBe('UNKNOWN_FIELD_TYPE_DATA');
      expect(results[0].path).toBe('unknown.type');
    });

    it('should work with empty path for root-level validation', () => {
      const spec = {
        byteLength: 4,
        fields: [
          {
            name: 'value',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          }
        ]
      } as const satisfies CodecSpec;

      const invalidData = {
        value: 'not-a-number'
      };

      const results = validateRuntimeData(spec, invalidData, registry, '');

      expect(results).toHaveLength(1);
      expect(results[0].path).toBe('value');
    });
  });

  describe('serialize with validation integration', () => {
    it('should serialize successfully with valid data', () => {
      const spec = {
        byteLength: 6,
        fields: [
          {
            name: 'id',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 2
          },
          {
            name: 'name',
            type: 'string',
            byteOffset: 2,
            byteLength: 4
          }
        ]
      } as const satisfies CodecSpec;

      const validData = {
        id: 1234,
        name: 'test'
      };

      expect(() => {
        serialize(spec, validData, registry, {
          validate: true
        });
      }).not.toThrow();
    });

    it('should throw ValidationError for invalid data when throwOnFatal is true', () => {
      const spec = {
        byteLength: 4,
        fields: [
          {
            name: 'value',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          }
        ]
      } as const satisfies CodecSpec;

      const invalidData = {
        value: 'not-a-number'
      };

      expect(() => {
        serialize(spec, invalidData, registry, {
          validate: true,
          throwOnFatal: true
        });
      }).toThrow(ValidationError);
    });

    it('should not throw when throwOnFatal is false', () => {
      const spec = {
        byteLength: 4,
        fields: [
          {
            name: 'value',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          }
        ]
      } as const satisfies CodecSpec;

      const invalidData = {
        value: 'not-a-number'
      };

      expect(() => {
        serialize(spec, invalidData, registry, {
          validate: true,
          throwOnFatal: false
        });
      }).not.toThrow();
    });

    it('should call onValidation callback when provided', () => {
      const spec = {
        byteLength: 4,
        fields: [
          {
            name: 'value',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 4
          }
        ]
      } as const satisfies CodecSpec;

      const invalidData = {
        value: 'not-a-number'
      };

      const validationResults: any[] = [];
      const onValidation = (results: any[]) => {
        validationResults.push(...results);
      };

      serialize(spec, invalidData, registry, {
        validate: true,
        throwOnFatal: false,
        onValidation
      });

      expect(validationResults.length).toBeGreaterThan(0);
      expect(validationResults.some(r => r.code === 'INVALID_NUMBER_DATA_TYPE')).toBe(true);
    });
  });

  describe('processValidationResults', () => {
    it('should not throw for warnings and info', () => {
      const results = [
        {
          level: ValidationLevel.WARNING,
          message: 'Test warning',
          path: 'test',
          code: 'TEST_WARNING'
        },
        {
          level: ValidationLevel.INFO,
          message: 'Test info',
          path: 'test',
          code: 'TEST_INFO'
        }
      ];

      expect(() => {
        processValidationResults(results, true);
      }).not.toThrow();
    });

    it('should throw for fatal errors when throwOnFatal is true', () => {
      const results = [
        {
          level: ValidationLevel.FATAL,
          message: 'Test fatal error',
          path: 'test',
          code: 'TEST_FATAL'
        }
      ];

      expect(() => {
        processValidationResults(results, true);
      }).toThrow(ValidationError);
    });

    it('should not throw for fatal errors when throwOnFatal is false', () => {
      const results = [
        {
          level: ValidationLevel.FATAL,
          message: 'Test fatal error',
          path: 'test',
          code: 'TEST_FATAL'
        }
      ];

      expect(() => {
        processValidationResults(results, false);
      }).not.toThrow();
    });

    it('should call onValidation callback', () => {
      const results = [
        {
          level: ValidationLevel.INFO,
          message: 'Test info',
          path: 'test',
          code: 'TEST_INFO'
        }
      ];

      let callbackResults: any[] = [];
      const onValidation = (validationResults: any[]) => {
        callbackResults = validationResults;
      };

      processValidationResults(results, true, onValidation);

      expect(callbackResults).toEqual(results);
    });
  });
});
