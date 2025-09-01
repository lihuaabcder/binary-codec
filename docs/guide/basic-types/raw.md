# Raw

The **raw codec** is the most fundamental codec in Binary Codec. It handles raw binary data as `Uint8Array` and serves as the foundation for other codecs like string.

## Overview

- **Type**: `'raw'`
- **Returns**: `Uint8Array`
- **Dependencies**: None (foundation codec)
- **Use Cases**: Binary data, byte arrays, building blocks for other codecs

## Basic Usage

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const spec = {
  byteLength: 6,
  fields: [
    {
      name: 'payload',
      type: 'raw',
      byteOffset: 0,
      byteLength: 6
    }
  ]
} as const satisfies CodecSpec;

// Create some binary data
const data = {
  payload: new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF])
};

// Serialize to buffer
const buffer = serialize(spec, data);

// Deserialize back - hover over result to see the type
const result = deserialize(spec, buffer);
console.log(result.payload); // Uint8Array(6) [170, 187, 204, 221, 238, 255]
```

## Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Field identifier |
| `type` | `'raw'` | ✅ | Must be `'raw'` |
| `byteOffset` | `number` | ✅ | Position in buffer (0-based) |
| `byteLength` | `number` | ✅ | Number of bytes to read/write (must be > 0) |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const spec = {
  byteLength: 10,
  fields: [
    {
      name: 'data', // Field identifier
      type: 'raw', // Codec type
      byteOffset: 2, // Start at byte 2
      byteLength: 8 // Read 8 bytes
    }
  ]
} as const satisfies CodecSpec;
```

## Memory Sharing

::: warning Important
The raw codec returns a **view** of the original buffer, not a copy. Modifying the returned `Uint8Array` will modify the original buffer:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

const spec = {
  byteLength: 4,
  fields: [
    {
      name: 'bytes',
      type: 'raw',
      byteOffset: 0,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

const buffer = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
const result = deserialize(spec, buffer);

// Modifying the result affects the original buffer
result.bytes[0] = 0xFF;
console.log(buffer[0]); // 255 (0xFF)
```

:::

## Error Handling

The raw codec performs validation at different stages:

### Specification Validation

This validation occurs during **both** deserialization and serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_RAW_LENGTH` | **FATAL** | Field `byteLength` must be positive (> 0) |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

// ❌ This spec will cause FATAL validation error in both operations
const invalidSpec = {
  byteLength: 4,
  fields: [
    {
      name: 'data',
      type: 'raw',
      byteOffset: 0,
      byteLength: 0 // INVALID_RAW_LENGTH: must be > 0
    }
  ]
} as const satisfies CodecSpec;

// const buffer = new Uint8Array(4)
// const result = deserialize(invalidSpec, buffer)  // Throws ValidationError
```

### Data Validation

This validation occurs **only** during serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_RAW_DATA_TYPE` | **FATAL** | Data must be `Uint8Array` |
| `RAW_DATA_LENGTH_MISMATCH` | **ERROR** | Data length must match `byteLength` |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 4,
  fields: [
    {
      name: 'data',
      type: 'raw',
      byteOffset: 0,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// ❌ INVALID_RAW_DATA_TYPE: not Uint8Array
// const result1 = serialize(spec, { data: [1, 2, 3, 4] })

// ❌ RAW_DATA_LENGTH_MISMATCH: wrong length
// const result2 = serialize(spec, { data: new Uint8Array([1, 2]) })

// ✅ Valid data
const result = serialize(spec, {
  data: new Uint8Array([1, 2, 3, 4])
});
```

## Real-World Examples

### File Header

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

const fileHeaderSpec = {
  byteLength: 16,
  fields: [
    {
      name: 'signature',
      type: 'raw',
      byteOffset: 0,
      byteLength: 4
    },
    {
      name: 'reserved',
      type: 'raw',
      byteOffset: 4,
      byteLength: 12
    }
  ]
} as const satisfies CodecSpec;

// Create buffer with PNG signature + 12 zero bytes
const buffer = new Uint8Array(16);
buffer.set([0x89, 0x50, 0x4E, 0x47], 0); // PNG signature

const header = deserialize(fileHeaderSpec, buffer);

// Check PNG signature
const pngSignature = [0x89, 0x50, 0x4E, 0x47];
const isPNG = Array.from(header.signature).every((byte, i) => byte === pngSignature[i]);
```

### Cryptographic Hash

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const hashSpec = {
  byteLength: 32,
  fields: [
    {
      name: 'sha256',
      type: 'raw',
      byteOffset: 0,
      byteLength: 32
    }
  ]
} as const satisfies CodecSpec;

// Type is automatically inferred as { sha256: Uint8Array }
```

## Next Steps

Now that you understand the raw codec, learn about codecs that build upon it:

- [String Codec](/guide/basic-types/string) - Text encoding using raw bytes
- [Number Codec](/guide/basic-types/number) - Numeric data handling
- [Bitset Codec](/guide/advanced/bitset) - Boolean arrays using raw bytes
