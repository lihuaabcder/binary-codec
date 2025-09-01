# Array Codec

The **array codec** handles repeating data structures by defining a single item specification that gets repeated across a fixed byte range. It can contain any non-array codec as items.

## Overview

- **Type**: `'array'`
- **Returns**: `unknown[]` (typed based on item specification)
- **Dependencies**: Any non-array codec (raw, string, number, bitset, bitmask, object)
- **Use Cases**: Lists, buffers, coordinate arrays, pixel data

## Basic Usage

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

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

// Serialize array to buffer
const data = {
  numbers: [10, 20, 30] // 3 items × 4 bytes = 12 bytes
};
const buffer = serialize(spec, data);

// Deserialize back - hover over result to see the type
const result = deserialize(spec, buffer);
console.log(result.numbers); // [10, 20, 30]
```

## Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Field identifier |
| `type` | `'array'` | ✅ | Must be `'array'` |
| `byteOffset` | `number` | ✅ | Position in buffer (0-based) |
| `byteLength` | `number` | ✅ | Total bytes for entire array |
| `item` | `ArrayItemField` | ✅ | Specification for each array item |

The `item` property can be any field specification **except** another array (no nested arrays):

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const spec = {
  byteLength: 20,
  fields: [
    {
      name: 'data',
      type: 'array',
      byteOffset: 0,
      byteLength: 20,
      item: { // Item specification
        type: 'string', // Any non-array codec
        byteLength: 5, // Size per item
        trimNull: true // Item-specific properties
      }
    }
  ]
} as const satisfies CodecSpec;
```

## Array Length Calculation

Array length is automatically calculated based on total byte size divided by item size:

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const bytesSpec = {
  byteLength: 16,
  fields: [
    {
      name: 'bytes',
      type: 'array',
      byteOffset: 0,
      byteLength: 16, // Total array size
      item: {
        type: 'number',
        numberType: 'uint',
        byteLength: 1 // Size per item
      }
    }
  ]
} as const satisfies CodecSpec;

// Array length = 16 ÷ 1 = 16 items
// Type inferred as { bytes: number[] }
```

## Item Types

### Number Arrays

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const coordinatesSpec = {
  byteLength: 24,
  fields: [
    {
      name: 'points',
      type: 'array',
      byteOffset: 0,
      byteLength: 24,
      item: {
        type: 'number',
        numberType: 'float',
        byteLength: 4
      }
    }
  ]
} as const satisfies CodecSpec;

const data = {
  points: [1.5, 2.7, 3.14, 4.0, 5.5, 6.28] // 6 floats × 4 bytes = 24 bytes
};
const buffer = serialize(coordinatesSpec, data);
```

### Bitmask Arrays

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const controlArraySpec = {
  byteLength: 6,
  fields: [
    {
      name: 'controls',
      type: 'array',
      byteOffset: 0,
      byteLength: 6,
      item: {
        type: 'bitmask',
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
            values: ['idle', 'active', 'pending', 'error']
          }
        }
      }
    }
  ]
} as const satisfies CodecSpec;

const data = {
  controls: [
    {
      enabled: true,
      priority: 5,
      status: 'active'
    },
    {
      enabled: false,
      priority: 2,
      status: 'idle'
    },
    {
      enabled: true,
      priority: 8,
      status: 'pending'
    }
  ]
};

const buffer = serialize(controlArraySpec, data);
const result = deserialize(controlArraySpec, buffer);
// Type: { controls: { enabled: boolean, priority: number, status: string }[] }
```

## Error Handling

The array codec performs validation at different stages:

### Specification Validation

This validation occurs during **both** deserialization and serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `MISSING_ARRAY_ITEM` | **FATAL** | Array field missing `item` specification |
| `INVALID_ARRAY_ITEM_LENGTH` | **FATAL** | Item `byteLength` must be positive |
| `ARRAY_LENGTH_NOT_DIVISIBLE` | **WARNING** | Array `byteLength` not evenly divisible by item size |
| `UNKNOWN_ARRAY_ITEM_TYPE` | **FATAL** | Unknown codec type in item specification |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ❌ These specs will cause validation errors
const invalidSpecs = [
  // MISSING_ARRAY_ITEM
  {
    byteLength: 10,
    fields: [
      {
        name: 'data',
        type: 'array',
        byteOffset: 0,
        byteLength: 10
        // Missing item specification
      }
    ]
  },

  // ARRAY_LENGTH_NOT_DIVISIBLE
  {
    byteLength: 10,
    fields: [
      {
        name: 'data',
        type: 'array',
        byteOffset: 0,
        byteLength: 10, // 10 ÷ 3 = 3.33... (not evenly divisible)
        item: {
          type: 'raw',
          byteLength: 3
        }
      }
    ]
  }
] as const;
```

### Data Validation

This validation occurs **only** during serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_ARRAY_DATA_TYPE` | **FATAL** | Data must be an array |
| `ARRAY_LENGTH_MISMATCH` | **ERROR** | Array length doesn't match expected length |
| Item validation errors | Various | Each array item is validated individually |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

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

// Expected length = 12 ÷ 4 = 3 items

// ❌ INVALID_ARRAY_DATA_TYPE: not an array
// const result1 = serialize(spec, { numbers: "not array" })

// ❌ ARRAY_LENGTH_MISMATCH: wrong length
// const result2 = serialize(spec, { numbers: [1, 2] }) // Only 2 items, expected 3

// ✅ Valid data
const result = serialize(spec, {
  numbers: [10, 20, 30]
});
```

## Real-World Examples

### RGB Pixel Data

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const pixelSpec = {
  byteLength: 12,
  fields: [
    {
      name: 'pixels',
      type: 'array',
      byteOffset: 0,
      byteLength: 12,
      item: {
        type: 'object',
        byteLength: 3,
        fields: [
          {
            name: 'r',
            type: 'number',
            numberType: 'uint',
            byteOffset: 0,
            byteLength: 1
          },
          {
            name: 'g',
            type: 'number',
            numberType: 'uint',
            byteOffset: 1,
            byteLength: 1
          },
          {
            name: 'b',
            type: 'number',
            numberType: 'uint',
            byteOffset: 2,
            byteLength: 1
          }
        ]
      }
    }
  ]
} as const satisfies CodecSpec;

const pixelData = {
  pixels: [
    {
      r: 255,
      g: 0,
      b: 0
    }, // Red
    {
      r: 0,
      g: 255,
      b: 0
    }, // Green
    {
      r: 0,
      g: 0,
      b: 255
    }, // Blue
    {
      r: 255,
      g: 255,
      b: 255
    } // White
  ]
};

const buffer = serialize(pixelSpec, pixelData);
const parsed = deserialize(pixelSpec, buffer);
// Type: { pixels: { r: number, g: number, b: number }[] }
```

## Limitations

::: warning Array Nesting Not Supported
Arrays cannot contain other arrays as items. Use object items with array fields for nested structures:

<!-- eslint-skip -->
```ts
// ❌ Not supported - nested arrays
{
  type: 'array',
  item: {
    type: 'array',  // Error!
    // ...
  }
}

// ✅ Supported - object with array field
{
  type: 'array',
  item: {
    type: 'object',
    fields: [
      {
        name: 'subArray',
        type: 'array',
        // ...
      }
    ]
  }
}
```

:::

## Next Steps

Now that you understand the array codec, continue with:

- [Object Codec](/guide/advanced/object) - Complex nested structures
