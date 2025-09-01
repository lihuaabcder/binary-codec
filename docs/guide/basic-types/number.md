# Number Codec

The **number codec** handles numeric data encoding and decoding using JavaScript's `DataView` for precise binary representation. It supports integers and floating-point numbers with different byte lengths.

## Overview

- **Type**: `'number'`
- **Returns**: `number`
- **Dependencies**: None (uses DataView directly)
- **Use Cases**: Counters, IDs, sizes, offsets, measurements

## Basic Usage

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

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
      name: 'count',
      type: 'number',
      numberType: 'uint',
      byteOffset: 2,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// Serialize numbers to buffer
const data = {
  id: 42,
  count: 1000
};
const buffer = serialize(spec, data);

// Deserialize back - hover over result to see the type
const result = deserialize(spec, buffer);
console.log(result.id); // 42
console.log(result.count); // 1000
```

## Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Field identifier |
| `type` | `'number'` | ✅ | Must be `'number'` |
| `byteOffset` | `number` | ✅ | Position in buffer (0-based) |
| `byteLength` | `1 \| 2 \| 4` | ✅ | Number of bytes (determines range) |
| `numberType` | `'uint' \| 'int' \| 'float'` | ✅ | Numeric representation type |
| `littleEndian` | `boolean` | ❌ | Byte order (default: `false` for big-endian) |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const spec = {
  byteLength: 8,
  fields: [
    {
      name: 'value',
      type: 'number',
      numberType: 'uint', // Unsigned integer
      byteOffset: 0,
      byteLength: 4, // 4 bytes = 32-bit
      littleEndian: true // Little-endian byte order
    }
  ]
} as const satisfies CodecSpec;
```

## Number Types

### Unsigned Integers (`uint`)

Non-negative whole numbers with different ranges:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const uintSpec = {
  byteLength: 7,
  fields: [
    {
      name: 'byte',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 1 // Range: 0 to 255
    },
    {
      name: 'short',
      type: 'number',
      numberType: 'uint',
      byteOffset: 1,
      byteLength: 2 // Range: 0 to 65,535
    },
    {
      name: 'long',
      type: 'number',
      numberType: 'uint',
      byteOffset: 3,
      byteLength: 4 // Range: 0 to 4,294,967,295
    }
  ]
} as const satisfies CodecSpec;

const data = {
  byte: 255,
  short: 65535,
  long: 4294967295
};
const buffer = serialize(uintSpec, data);
```

### Signed Integers (`int`)

Positive and negative whole numbers:

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const intSpec = {
  byteLength: 7,
  fields: [
    {
      name: 'byte',
      type: 'number',
      numberType: 'int',
      byteOffset: 0,
      byteLength: 1 // Range: -128 to 127
    },
    {
      name: 'short',
      type: 'number',
      numberType: 'int',
      byteOffset: 1,
      byteLength: 2 // Range: -32,768 to 32,767
    },
    {
      name: 'long',
      type: 'number',
      numberType: 'int',
      byteOffset: 3,
      byteLength: 4 // Range: -2,147,483,648 to 2,147,483,647
    }
  ]
} as const satisfies CodecSpec;
```

### Floating Point (`float`)

Decimal numbers with IEEE 754 representation:

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const floatSpec = {
  byteLength: 4,
  fields: [
    {
      name: 'temperature',
      type: 'number',
      numberType: 'float',
      byteOffset: 0,
      byteLength: 4 // 32-bit IEEE 754 float
    }
  ]
} as const satisfies CodecSpec;

// Type is automatically inferred as { temperature: number }
```

## Byte Order (Endianness)

Control byte order for multi-byte numbers:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const endianSpec = {
  byteLength: 8,
  fields: [
    {
      name: 'bigEndian',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 4,
      littleEndian: false // Big-endian (default)
    },
    {
      name: 'littleEndian',
      type: 'number',
      numberType: 'uint',
      byteOffset: 4,
      byteLength: 4,
      littleEndian: true // Little-endian
    }
  ]
} as const satisfies CodecSpec;

const data = {
  bigEndian: 0x12345678,
  littleEndian: 0x12345678
};
const buffer = serialize(endianSpec, data);

// Big-endian:    [0x12, 0x34, 0x56, 0x78]
// Little-endian: [0x78, 0x56, 0x34, 0x12]
```

## Error Handling

The number codec performs validation at different stages:

### Specification Validation

This validation occurs during **both** deserialization and serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_NUMBER_TYPE_LENGTH` | **FATAL** | Invalid `numberType` and `byteLength` combination |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ❌ This spec will cause FATAL validation error in both operations
const invalidSpec = {
  byteLength: 8,
  fields: [
    {
      name: 'value',
      type: 'number',
      numberType: 'float',
      byteOffset: 0,
      byteLength: 8 as any // INVALID_NUMBER_TYPE_LENGTH: float only supports 4 bytes
    }
  ]
} as const satisfies CodecSpec;
```

Valid combinations:

- `uint`: 1, 2, or 4 bytes
- `int`: 1, 2, or 4 bytes
- `float`: 4 bytes only

### Data Validation

This validation occurs **only** during serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_NUMBER_DATA_TYPE` | **FATAL** | Data must be a number |
| `INVALID_UINT_VALUE` | **ERROR** | Value must be non-negative integer for uint |
| `UINT_VALUE_OUT_OF_RANGE` | **ERROR** | Value exceeds maximum for byte length |
| `INVALID_INT_VALUE` | **ERROR** | Value must be integer for int |
| `INT_VALUE_OUT_OF_RANGE` | **ERROR** | Value exceeds range for byte length |
| `NON_FINITE_FLOAT_VALUE` | **WARNING** | Float value is not finite |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 4,
  fields: [
    {
      name: 'value',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 2 // Range: 0 to 65,535
    }
  ]
} as const satisfies CodecSpec;

// ❌ INVALID_NUMBER_DATA_TYPE: not a number
// const result1 = serialize(spec, { value: "123" })

// ❌ INVALID_UINT_VALUE: negative value for uint
// const result2 = serialize(spec, { value: -1 })

// ❌ UINT_VALUE_OUT_OF_RANGE: exceeds 2-byte range
// const result3 = serialize(spec, { value: 100000 })

// ✅ Valid data
const result = serialize(spec, {
  value: 42
});
```

## Real-World Examples

### Protocol Header

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

const protocolSpec = {
  byteLength: 8,
  fields: [
    {
      name: 'version',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 1
    },
    {
      name: 'messageType',
      type: 'number',
      numberType: 'uint',
      byteOffset: 1,
      byteLength: 1
    },
    {
      name: 'sequenceId',
      type: 'number',
      numberType: 'uint',
      byteOffset: 2,
      byteLength: 4
    },
    {
      name: 'checksum',
      type: 'number',
      numberType: 'uint',
      byteOffset: 6,
      byteLength: 2
    }
  ]
} as const satisfies CodecSpec;

const buffer = new Uint8Array([0x01, 0x05, 0x00, 0x00, 0x03, 0xE8, 0x1A, 0x2B]);
const header = deserialize(protocolSpec, buffer);

console.log(header.version); // 1
console.log(header.messageType); // 5
console.log(header.sequenceId); // 1000
console.log(header.checksum); // 6699
```

### Sensor Data

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const sensorSpec = {
  byteLength: 12,
  fields: [
    {
      name: 'timestamp',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 4
    },
    {
      name: 'temperature',
      type: 'number',
      numberType: 'float',
      byteOffset: 4,
      byteLength: 4
    },
    {
      name: 'humidity',
      type: 'number',
      numberType: 'float',
      byteOffset: 8,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// Type is automatically inferred as:
// { timestamp: number, temperature: number, humidity: number }
```

## Next Steps

Now that you understand the number codec, continue with:

- [Bitset Codec](/guide/advanced/bitset) - Bit manipulation
- [Bitmask Codec](/guide/advanced/bitmask) - Bit field extraction
- [Array Codec](/guide/advanced/array) - Repeating structures
