# Bitset Codec

The **bitset codec** handles arrays of boolean values by packing them efficiently into bits. Each byte stores 8 boolean values using LSB-first bit ordering, making it ideal for flags, permissions, and state tracking.

## Overview

- **Type**: `'bitset'`
- **Returns**: `boolean[]`
- **Dependencies**: Number codec (uses uint8 internally)
- **Use Cases**: Feature flags, permissions, boolean arrays, state indicators

## Basic Usage

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const spec = {
  byteLength: 2,
  fields: [
    {
      name: 'flags',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 2 // 2 bytes = 16 bits = 16 booleans
    }
  ]
} as const satisfies CodecSpec;

// Serialize boolean array to buffer
const data = {
  flags: [
    true,
    false,
    true,
    false, // First byte, bits 0-3
    true,
    true,
    false,
    false, // First byte, bits 4-7
    false,
    true,
    false,
    true, // Second byte, bits 0-3
    false,
    false,
    true,
    true // Second byte, bits 4-7
  ]
};
const buffer = serialize(spec, data);

// Deserialize back - hover over result to see the type
const result = deserialize(spec, buffer);
console.log(result.flags); // boolean[16]
```

## Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Field identifier |
| `type` | `'bitset'` | ✅ | Must be `'bitset'` |
| `byteOffset` | `number` | ✅ | Position in buffer (0-based) |
| `byteLength` | `number` | ✅ | Number of bytes (determines bit count) |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const spec = {
  byteLength: 4,
  fields: [
    {
      name: 'permissions',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 4 // 4 bytes = 32 bits = 32 booleans
    }
  ]
} as const satisfies CodecSpec;
```

## Bit Ordering (LSB-First)

Bits are ordered from **least significant bit (LSB)** to **most significant bit (MSB)** within each byte:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 1,
  fields: [
    {
      name: 'bits',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 1 // 1 byte = 8 bits
    }
  ]
} as const satisfies CodecSpec;

const data = {
  // LSB-first ordering within the byte:
  bits: [false, true, false, false, true, true, false, true]
  //     ↑     ↑     ↑     ↑     ↑     ↑     ↑     ↑
  //    bit0  bit1  bit2  bit3  bit4  bit5  bit6  bit7
  //     0     1     0     0     1     1     0     1
  //                Binary: 10110010 = 0xB2 = 178
};

const buffer = serialize(spec, data);
console.log(buffer[0]); // 178 (0xB2 in binary: 10110010)
```

## Multi-Byte Bitsets

For multi-byte bitsets, bits are concatenated by bytes (LSB-first within each byte):

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const spec = {
  byteLength: 2,
  fields: [
    {
      name: 'bits',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 2 // 16 bits total
    }
  ]
} as const satisfies CodecSpec;

const data = {
  bits: [
    // First byte (bits 0-7)
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    // Second byte (bits 8-15)
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    true
  ]
};

const buffer = serialize(spec, data);
console.log(Array.from(buffer)); // [0x01, 0x80]
// First byte:  0x01 (binary: 00000001, LSB=true)
// Second byte: 0x80 (binary: 10000000, MSB=true)

const result = deserialize(spec, buffer);
console.log(result.bits[0]); // true  (first bit of first byte)
console.log(result.bits[15]); // true  (last bit of second byte)
```

## Length Calculation

The number of boolean values equals `byteLength × 8`:

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const examples = [
  {
    byteLength: 1, // 1 × 8 = 8 booleans
    name: 'byte'
  },
  {
    byteLength: 2, // 2 × 8 = 16 booleans
    name: 'word'
  },
  {
    byteLength: 4, // 4 × 8 = 32 booleans
    name: 'dword'
  }
] as const;

const multiSpec = {
  byteLength: 7,
  fields: [
    {
      name: 'byte',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 1 // 8 booleans
    },
    {
      name: 'word',
      type: 'bitset',
      byteOffset: 1,
      byteLength: 2 // 16 booleans
    },
    {
      name: 'dword',
      type: 'bitset',
      byteOffset: 3,
      byteLength: 4 // 32 booleans
    }
  ]
} as const satisfies CodecSpec;

// Type inferred as:
// { byte: boolean[], word: boolean[], dword: boolean[] }
```

## Error Handling

The bitset codec performs validation at different stages:

### Specification Validation

This validation occurs during **both** deserialization and serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_BITSET_LENGTH` | **FATAL** | Field `byteLength` must be positive (> 0) |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ❌ This spec will cause FATAL validation error in both operations
const invalidSpec = {
  byteLength: 4,
  fields: [
    {
      name: 'flags',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 0 // INVALID_BITSET_LENGTH: must be > 0
    }
  ]
} as const satisfies CodecSpec;
```

### Data Validation

This validation occurs **only** during serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_BITSET_DATA_TYPE` | **FATAL** | Data must be an array |
| `BITSET_LENGTH_MISMATCH` | **ERROR** | Array length must equal `byteLength × 8` |
| `INVALID_BITSET_ELEMENT_TYPE` | **ERROR** | All array elements must be boolean |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 2,
  fields: [
    {
      name: 'flags',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 2 // Expected: 16 booleans
    }
  ]
} as const satisfies CodecSpec;

// ❌ INVALID_BITSET_DATA_TYPE: not an array
// const result1 = serialize(spec, { flags: "not array" })

// ❌ BITSET_LENGTH_MISMATCH: wrong length
// const result2 = serialize(spec, { flags: [true, false] }) // Only 2, expected 16

// ❌ INVALID_BITSET_ELEMENT_TYPE: not boolean
// const result3 = serialize(spec, { flags: Array(16).fill(1) }) // Numbers, not booleans

// ✅ Valid data
const result = serialize(spec, {
  flags: Array.from({
    length: 16
  }).fill(false).map((_, i) => i % 2 === 0)
});
```

## Real-World Examples

### Permission System

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const permissionSpec = {
  byteLength: 1,
  fields: [
    {
      name: 'permissions',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 1 // 8 permission flags
    }
  ]
} as const satisfies CodecSpec;

const userPermissions = {
  permissions: [
    true, // read (bit 0)
    true, // write (bit 1)
    false, // execute (bit 2)
    true, // delete (bit 3)
    false, // admin (bit 4)
    false, // modify (bit 5)
    true, // share (bit 6)
    false // export (bit 7)
  ]
};

const buffer = serialize(permissionSpec, userPermissions);
const parsed = deserialize(permissionSpec, buffer);

// Check specific permissions
const [read, write, execute, deletePerm] = parsed.permissions;
console.log({
  read,
  write,
  execute,
  delete: deletePerm
});
// { read: true, write: true, execute: false, delete: true }
```

### Feature Flags Configuration

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const configSpec = {
  byteLength: 4,
  fields: [
    {
      name: 'features',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 4 // 32 feature flags
    }
  ]
} as const satisfies CodecSpec;

// Create feature flags array (32 bits)
const features = Array.from({
  length: 32
}).fill(false);
features[0] = true; // darkMode
features[2] = true; // notifications
features[5] = true; // analytics
features[10] = true; // betaFeatures

const config = {
  features
};
const buffer = serialize(configSpec, config);

// Read back and check specific features
const parsed = deserialize(configSpec, buffer);
const isDarkModeEnabled = parsed.features[0];
const areNotificationsEnabled = parsed.features[2];
```

### Game Progress Tracking

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const gameStateSpec = {
  byteLength: 12,
  fields: [
    {
      name: 'levelsCompleted',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 8 // 64 levels
    },
    {
      name: 'achievementsUnlocked',
      type: 'bitset',
      byteOffset: 8,
      byteLength: 4 // 32 achievements
    }
  ]
} as const satisfies CodecSpec;

// Type inferred as:
// {
//   levelsCompleted: boolean[],      // 64 booleans
//   achievementsUnlocked: boolean[]  // 32 booleans
// }
```

## Performance Considerations

Bitsets are very memory efficient for boolean arrays:

```ts
// Memory comparison for 1000 boolean values:

// Regular boolean array: ~1000 bytes (1 byte per boolean in most JS engines)
const boolArray: boolean[] = Array.from({
  length: 1000
}).fill(false);

// Bitset: 125 bytes (8 booleans per byte)
// byteLength: Math.ceil(1000 / 8) = 125 bytes
const bitsetSpec = {
  byteLength: 125, // 125 × 8 = 1000 bits
  fields: [
    {
      name: 'flags',
      type: 'bitset',
      byteOffset: 0,
      byteLength: 125
    }
  ]
} as const;

// 87.5% memory savings!
```

## Next Steps

Now that you understand the bitset codec, continue with:

- [Bitmask Codec](/guide/advanced/bitmask) - Bit field extraction
- [Array Codec](/guide/advanced/array) - Repeating structures
- [Object Codec](/guide/advanced/object) - Complex nested structures
