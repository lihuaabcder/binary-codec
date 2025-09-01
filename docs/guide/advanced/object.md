# Object Codec

The **object codec** is the most powerful codec, capable of combining any other codec types into complex nested structures. It serves as the foundation for the main `serialize` and `deserialize` functions.

## Overview

- **Type**: `'object'`
- **Returns**: `Record<string, any>` (typed based on field specifications)
- **Dependencies**: Any codec (raw, string, number, bitset, bitmask, array, object)
- **Use Cases**: Complex data structures, nested objects, protocol messages, file formats

## Basic Usage

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

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
          byteLength: 4
        },
        {
          name: 'flags',
          type: 'number',
          numberType: 'uint',
          byteOffset: 4,
          byteLength: 4
        }
      ]
    },
    {
      name: 'data',
      type: 'string',
      byteOffset: 8,
      byteLength: 8
    }
  ]
} as const satisfies CodecSpec;

// Hover over MessageType to see the inferred structure
type MessageType = Infer<typeof spec>;

// Serialize complex object to buffer
const data = {
  header: {
    version: 1,
    flags: 0x12345678
  },
  data: 'payload'
};
const buffer = serialize(spec, data);

// Deserialize back - hover over result to see the type
const result = deserialize(spec, buffer);
console.log(result.header.version); // number
console.log(result.data); // string
```

## Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Field identifier |
| `type` | `'object'` | ✅ | Must be `'object'` |
| `byteOffset` | `number` | ✅ | Position in buffer (0-based) |
| `byteLength` | `number` | ✅ | Total bytes for the object |
| `fields` | `Field[]` | ✅ | Array of nested field specifications |
| `littleEndian` | `boolean` | ❌ | Default byte order for nested fields |

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const spec = {
  byteLength: 20,
  fields: [
    {
      name: 'config',
      type: 'object',
      byteOffset: 0,
      byteLength: 20,
      littleEndian: true, // Default for nested fields
      fields: [
        {
          name: 'id',
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 4
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over ConfigType to see the inferred structure
type ConfigType = Infer<typeof spec>;
```

## Nested Structures

Objects can contain any combination of codec types:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const complexSpec = {
  byteLength: 32,
  fields: [
    {
      name: 'document',
      type: 'object',
      byteOffset: 0,
      byteLength: 32,
      fields: [
        {
          name: 'signature',
          type: 'raw',
          byteOffset: 0,
          byteLength: 4
        },
        {
          name: 'version',
          type: 'number',
          numberType: 'uint',
          byteOffset: 4,
          byteLength: 2
        },
        {
          name: 'title',
          type: 'string',
          byteOffset: 6,
          byteLength: 10
        },
        {
          name: 'flags',
          type: 'bitmask',
          byteOffset: 16,
          byteLength: 2,
          map: {
            encrypted: {
              bits: 0,
              type: 'boolean'
            },
            compressed: {
              bits: 1,
              type: 'boolean'
            },
            priority: {
              bits: [7, 4],
              type: 'uint'
            }
          }
        },
        {
          name: 'permissions',
          type: 'bitset',
          byteOffset: 18,
          byteLength: 2
        },
        {
          name: 'timestamps',
          type: 'array',
          byteOffset: 20,
          byteLength: 12,
          item: {
            type: 'number',
            numberType: 'uint',
            byteLength: 4
          }
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over DocumentType to see the deeply nested structure with full type safety
type DocumentType = Infer<typeof complexSpec>;
```

## Deeply Nested Objects

Objects can contain other objects for hierarchical structures:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const nestedSpec = {
  byteLength: 20,
  fields: [
    {
      name: 'packet',
      type: 'object',
      byteOffset: 0,
      byteLength: 20,
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
              byteLength: 4
            },
            {
              name: 'control',
              type: 'object',
              byteOffset: 4,
              byteLength: 4,
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
                  name: 'count',
                  type: 'number',
                  numberType: 'uint',
                  byteOffset: 2,
                  byteLength: 2
                }
              ]
            }
          ]
        },
        {
          name: 'payload',
          type: 'string',
          byteOffset: 8,
          byteLength: 12
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over PacketType to see the nested type structure
type PacketType = Infer<typeof nestedSpec>;
```

## Relative Byte Offsets

In nested objects, `byteOffset` is **relative** to the parent object:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const spec = {
  byteLength: 20,
  fields: [
    {
      name: 'container',
      type: 'object',
      byteOffset: 5, // Object starts at byte 5 in main buffer
      byteLength: 10,
      fields: [
        {
          name: 'field1',
          type: 'number',
          numberType: 'uint',
          byteOffset: 2, // Relative to object start (actual: 5 + 2 = 7)
          byteLength: 4
        },
        {
          name: 'field2',
          type: 'string',
          byteOffset: 6, // Relative to object start (actual: 5 + 6 = 11)
          byteLength: 4
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over ContainerType to see the inferred type
type ContainerType = Infer<typeof spec>;

// Absolute positions in buffer:
// - container object: bytes 5-14
// - field1: bytes 7-10
// - field2: bytes 11-14
```

## Optional Fields

During serialization, missing object fields are skipped without error:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 12,
  fields: [
    {
      name: 'data',
      type: 'object',
      byteOffset: 0,
      byteLength: 12,
      fields: [
        {
          name: 'required',
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 4
        },
        {
          name: 'optional',
          type: 'string',
          byteOffset: 4,
          byteLength: 8
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over DataType to see optional field handling
type DataType = Infer<typeof spec>;

// Only provide some fields
const partialData = {
  data: {
    required: 42
    // optional field missing - generates WARNING but continues
  }
};

const buffer = serialize(spec, partialData);
```

## Error Handling

The object codec performs validation at different stages:

### Specification Validation

This validation occurs during **both** deserialization and serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `MISSING_OBJECT_FIELDS` | **FATAL** | Object field missing `fields` array |
| `EMPTY_OBJECT_FIELDS` | **WARNING** | Object field has empty `fields` array |
| `OBJECT_FIELD_OUT_OF_BOUNDS` | **FATAL** | Nested field extends beyond object boundary |
| `UNKNOWN_FIELD_TYPE` | **FATAL** | Unknown codec type in nested field |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ❌ These specs will cause validation errors
const invalidSpecs = [
  // MISSING_OBJECT_FIELDS
  {
    byteLength: 10,
    fields: [
      {
        name: 'config',
        type: 'object',
        byteOffset: 0,
        byteLength: 10
        // Missing fields array
      }
    ]
  },

  // OBJECT_FIELD_OUT_OF_BOUNDS
  {
    byteLength: 5,
    fields: [
      {
        name: 'data',
        type: 'object',
        byteOffset: 0,
        byteLength: 5,
        fields: [
          {
            name: 'value',
            type: 'number',
            numberType: 'uint',
            byteOffset: 2,
            byteLength: 4 // 2 + 4 = 6 > 5 (exceeds boundary)
          }
        ]
      }
    ]
  }
] as const;
```

### Data Validation

This validation occurs **only** during serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_OBJECT_DATA_TYPE` | **FATAL** | Data must be an object |
| `MISSING_OBJECT_FIELD_DATA` | **WARNING** | Required field missing from data |
| `EXTRA_OBJECT_FIELD_DATA` | **INFO** | Extra field in data not in specification |
| Nested field errors | Various | Each nested field is validated recursively |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 8,
  fields: [
    {
      name: 'config',
      type: 'object',
      byteOffset: 0,
      byteLength: 8,
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
          byteLength: 4
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// ❌ INVALID_OBJECT_DATA_TYPE: not an object
// const result1 = serialize(spec, { config: "not object" })

// ⚠️ MISSING_OBJECT_FIELD_DATA: missing fields
// const result2 = serialize(spec, { config: { id: 42 } }) // Missing 'name'

// ℹ️ EXTRA_OBJECT_FIELD_DATA: extra fields
// const result3 = serialize(spec, { config: { id: 42, name: "test", extra: "field" } })

// ✅ Valid data
const result = serialize(spec, {
  config: {
    id: 42,
    name: 'test'
  }
});
```

## Real-World Examples

### Protocol Message

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const messageSpec = {
  byteLength: 32,
  fields: [
    {
      name: 'message',
      type: 'object',
      byteOffset: 0,
      byteLength: 32,
      fields: [
        {
          name: 'header',
          type: 'object',
          byteOffset: 0,
          byteLength: 12,
          fields: [
            {
              name: 'signature',
              type: 'raw',
              byteOffset: 0,
              byteLength: 4
            },
            {
              name: 'version',
              type: 'number',
              numberType: 'uint',
              byteOffset: 4,
              byteLength: 2
            },
            {
              name: 'messageType',
              type: 'number',
              numberType: 'uint',
              byteOffset: 6,
              byteLength: 2
            },
            {
              name: 'length',
              type: 'number',
              numberType: 'uint',
              byteOffset: 8,
              byteLength: 4
            }
          ]
        },
        {
          name: 'body',
          type: 'string',
          byteOffset: 12,
          byteLength: 20
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over Message to see the nested type structure
type Message = Infer<typeof messageSpec>;

const message = {
  message: {
    header: {
      signature: new Uint8Array([0x4D, 0x53, 0x47, 0x00]), // "MSG\0"
      version: 1,
      messageType: 100,
      length: 20
    },
    body: 'Hello, World!'
  }
};

const buffer = serialize(messageSpec, message);
// Hover over parsed to see the full type inference
const parsed = deserialize(messageSpec, buffer);
```

### File Format Structure

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const fileSpec = {
  byteLength: 64,
  fields: [
    {
      name: 'file',
      type: 'object',
      byteOffset: 0,
      byteLength: 64,
      fields: [
        {
          name: 'header',
          type: 'object',
          byteOffset: 0,
          byteLength: 32,
          fields: [
            {
              name: 'magic',
              type: 'raw',
              byteOffset: 0,
              byteLength: 8
            },
            {
              name: 'metadata',
              type: 'object',
              byteOffset: 8,
              byteLength: 16,
              fields: [
                {
                  name: 'version',
                  type: 'number',
                  numberType: 'uint',
                  byteOffset: 0,
                  byteLength: 4
                },
                {
                  name: 'flags',
                  type: 'bitmask',
                  byteOffset: 4,
                  byteLength: 2,
                  map: {
                    compressed: {
                      bits: 0,
                      type: 'boolean'
                    },
                    encrypted: {
                      bits: 1,
                      type: 'boolean'
                    },
                    version: {
                      bits: [7, 4],
                      type: 'uint'
                    }
                  }
                },
                {
                  name: 'permissions',
                  type: 'bitset',
                  byteOffset: 6,
                  byteLength: 2
                },
                {
                  name: 'checksum',
                  type: 'number',
                  numberType: 'uint',
                  byteOffset: 8,
                  byteLength: 4
                },
                {
                  name: 'reserved',
                  type: 'raw',
                  byteOffset: 12,
                  byteLength: 4
                }
              ]
            },
            {
              name: 'name',
              type: 'string',
              byteOffset: 24,
              byteLength: 8
            }
          ]
        },
        {
          name: 'entries',
          type: 'array',
          byteOffset: 32,
          byteLength: 32,
          item: {
            type: 'object',
            byteLength: 8,
            fields: [
              {
                name: 'id',
                type: 'number',
                numberType: 'uint',
                byteOffset: 0,
                byteLength: 4
              },
              {
                name: 'size',
                type: 'number',
                numberType: 'uint',
                byteOffset: 4,
                byteLength: 4
              }
            ]
          }
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over FileFormat to see the complete inferred type with all nested structures
type FileFormat = Infer<typeof fileSpec>;
```

## Root-Level Usage

The main `serialize` and `deserialize` functions use the object codec internally:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

// This spec is handled by the object codec
const spec = {
  byteLength: 8,
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
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// Hover over SimpleType to see the root-level type
type SimpleType = Infer<typeof spec>;

// Equivalent to using object codec directly
const data = {
  id: 42,
  name: 'test'
};
const buffer = serialize(spec, data);

// Hover over result to see the inferred return type
const result = deserialize(spec, buffer);
```

## Complex Type Combinations

Showcase how all codecs work together in a single structure:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const allTypesSpec = {
  byteLength: 40,
  fields: [
    {
      name: 'complex',
      type: 'object',
      byteOffset: 0,
      byteLength: 40,
      fields: [
        {
          name: 'rawData',
          type: 'raw',
          byteOffset: 0,
          byteLength: 4
        },
        {
          name: 'title',
          type: 'string',
          byteOffset: 4,
          byteLength: 8
        },
        {
          name: 'count',
          type: 'number',
          numberType: 'uint',
          byteOffset: 12,
          byteLength: 4
        },
        {
          name: 'flags',
          type: 'bitset',
          byteOffset: 16,
          byteLength: 2
        },
        {
          name: 'control',
          type: 'bitmask',
          byteOffset: 18,
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
              bits: [15, 8],
              type: 'enum',
              values: ['idle', 'active', 'pending', 'error']
            }
          }
        },
        {
          name: 'items',
          type: 'array',
          byteOffset: 20,
          byteLength: 12,
          item: {
            type: 'number',
            numberType: 'uint',
            byteLength: 4
          }
        },
        {
          name: 'nested',
          type: 'object',
          byteOffset: 32,
          byteLength: 8,
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
              byteLength: 4
            }
          ]
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over ComplexType to see how all codec types are combined with full type safety
type ComplexType = Infer<typeof allTypesSpec>;
```

## Performance Considerations

Objects provide structural organization but add processing overhead:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

// Flat structure (faster)
const flatSpec = {
  byteLength: 8,
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
      type: 'string',
      byteOffset: 4,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// Nested structure (more organized, slightly slower)
const nestedSpec = {
  byteLength: 8,
  fields: [
    {
      name: 'container',
      type: 'object',
      byteOffset: 0,
      byteLength: 8,
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
          type: 'string',
          byteOffset: 4,
          byteLength: 4
        }
      ]
    }
  ]
} as const satisfies CodecSpec;

// Hover over FlatType and NestedType to compare the resulting types
type FlatType = Infer<typeof flatSpec>;
type NestedType = Infer<typeof nestedSpec>;
```

## Next Steps

You've now learned all the codecs in Binary Codec! Continue with:

- [Validation System](/guide/advanced/validation) - Understanding error handling
- [API Reference](/api/) - Complete API documentation
