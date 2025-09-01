# binary-codec

A lightweight TypeScript library for type-safe binary data serialization/deserialization using `Uint8Array`.

## Features

- 🚀 **Type-safe binary operations** - Full TypeScript type inference from codec specs
- 📦 **Uint8Array focused** - Designed specifically for `Uint8Array` data
- 📝 **Declarative schema approach** - Define binary structures using simple objects
- 🔧 **Extensible codec system** - Support for custom data types through registry
- ✅ **Built-in validation** - Comprehensive validation for both schemas and runtime data

## Installation

```bash
npm install binary-codec
# or
pnpm add binary-codec
# or
yarn add binary-codec
```

## Quick Start

```typescript
import type { CodecSpec, Infer } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

// Define your binary structure
const packetSpec = {
  byteLength: 8,
  fields: [
    { 
      name: 'header', 
      type: 'number', 
      byteOffset: 0, 
      byteLength: 2, 
      readerType: 'Uint16' 
    },
    { 
      name: 'payload', 
      type: 'raw', 
      byteOffset: 2, 
      byteLength: 6 
    }
  ]
} as const satisfies CodecSpec;

// Get full type inference
type Packet = Infer<typeof packetSpec>;
// Inferred type: { header: number; payload: Uint8Array }

// Deserialize binary data
const buffer = new Uint8Array([0x12, 0x34, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
const packet = deserialize(packetSpec, buffer);

// Serialize back to binary
const binaryData = serialize(packetSpec, {
  header: 0x1234,
  payload: new Uint8Array([1, 2, 3, 4, 5, 6])
});
```

## Supported Data Types

### Basic Types

- **`raw`** - Raw bytes as `Uint8Array`
- **`string`** - Text with encoding support (utf8, ascii, etc.)
- **`number`** - Integers with various sizes (Uint8, Int16, Uint32, etc.)

### Advanced Types

- **`bitset`** - Boolean arrays with bit-level packing
- **`bitmask`** - Structured bit fields with named boolean/enum/uint fields
- **`array`** - Arrays of other codec types
- **`object`** - Nested structures with multiple fields

## Core API

```typescript
// Deserialize Uint8Array to typed object
function deserialize<T extends CodecSpec>(
  spec: T, 
  buffer: Uint8Array, 
  registry?: CodecRegistry,
  options?: ValidationOptions
): Infer<T>

// Serialize typed object to Uint8Array
function serialize(
  spec: CodecSpec, 
  value: Record<string, any>,
  registry?: CodecRegistry,
  options?: ValidationOptions  
): Uint8Array

// Type inference utility
type Infer<T extends CodecSpec> = // Inferred type from spec
```

## Working with Uint8Array

This library is specifically designed for `Uint8Array` operations:

```typescript
// Input: Uint8Array
const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
const decoded = deserialize(spec, binaryData);

// Output: Uint8Array 
const encoded = serialize(spec, data);
console.log(encoded instanceof Uint8Array); // true

// Raw fields preserve Uint8Array type
const rawSpec = {
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

type RawType = Infer<typeof rawSpec>; 
// { data: Uint8Array }
```

## Documentation

For comprehensive guides and examples, visit the [documentation](https://lihuaabcder.github.io/binary-codec/).

## License

MIT
