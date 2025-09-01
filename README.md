# binary-codec

> A lightweight TypeScript utility library for working with binary data.
> Encode and decode numbers, strings, bitmasks, arrays, and objects directly from `ArrayBuffer`/`DataView`.

[![npm version](https://img.shields.io/npm/v/binary-codec.svg)](https://www.npmjs.com/package/binary-codec)
[![license](https://img.shields.io/npm/l/binary-codec.svg)](./LICENSE)

---

## ✨ Features

* 📦 **Lightweight** – minimal runtime dependency, pure TypeScript.
* 🧩 **Modular codecs** – numbers, strings, bitmasks, arrays, objects.
* 🔧 **Extensible** – define and register your own custom codec.
* 🔄 **Symmetric design** – consistent `read` / `write` API.
* 🌐 **Cross-platform** – works in Node.js and modern browsers.
* 🧠 **Type inference from config** – generate precise TypeScript types automatically from your codec configuration, no manual typing needed.
* ✅ **Built-in validation** – comprehensive validation system to catch configuration errors early.
* 🔍 **Recursive validation** – validates nested structures with precise error paths.

---

## 🚀 Installation

```bash
pnpm add binary-codec
# or
npm install binary-codec
# or
yarn add binary-codec
```

---

## ⚡ Quick Start

### Basic Usage

```ts
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

// Define your data structure
const packetSpec = {
  byteLength: 21,
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
      byteLength: 16
    },
    {
      name: 'flags',
      type: 'bitmask',
      byteOffset: 20,
      byteLength: 1,
      map: {
        enabled: {
          bits: 0,
          type: 'boolean'
        },
        priority: {
          bits: [3, 1],
          type: 'uint'
        }
      }
    }
  ]
} as const satisfies CodecSpec;

// Deserialize binary data
const buffer = new ArrayBuffer(21);
const data = deserialize(buffer, packetSpec);
// Type: { id: number; name: string; flags: { enabled: boolean; priority: number } }

// Serialize data to binary
const binaryData = serialize(data, packetSpec);
```

### Individual Codecs

```ts
import { createRegistry, numberCodec, stringCodec } from 'binary-codec';

// Create a buffer
const buffer = new ArrayBuffer(16);
const view = new DataView(buffer);
const registry = createRegistry();

// Write a uint32
numberCodec.write!(view, {
  numberType: 'uint',
  byteOffset: 0,
  byteLength: 4
}, 42, registry.resolver());

// Read it back
const value = numberCodec.read(view, {
  numberType: 'uint',
  byteOffset: 0,
  byteLength: 4
}, registry.resolver());
console.log(value); // 42
```

---

## 📖 Built-in Codecs

### Number Codec

Handles integers and floating-point numbers with configurable byte lengths:

```ts
import { numberCodec } from 'binary-codec';

// Unsigned integers: 1, 2, or 4 bytes
{ type: 'number', numberType: 'uint', byteLength: 1 }   // 0-255
{ type: 'number', numberType: 'uint', byteLength: 2 }   // 0-65535
{ type: 'number', numberType: 'uint', byteLength: 4 }   // 0-4294967295

// Signed integers: 1, 2, or 4 bytes
{ type: 'number', numberType: 'int', byteLength: 1 }    // -128 to 127
{ type: 'number', numberType: 'int', byteLength: 2 }    // -32768 to 32767
{ type: 'number', numberType: 'int', byteLength: 4 }    // -2147483648 to 2147483647

// Floating-point: 4 bytes only
{ type: 'number', numberType: 'float', byteLength: 4 }  // IEEE 754 single precision
```

### String Codec

Fixed-length UTF-8 encoded strings:

```ts
import { stringCodec } from 'binary-codec';

{
  type: 'string',
  byteOffset: 0,
  byteLength: 32,
  encoding: 'utf-8',     // optional, defaults to 'utf-8'
  trimNull: true         // optional, defaults to true
}
```

### Bitmask Codec

Extract and map individual bits or bit ranges:

```ts
import { bitmaskCodec } from 'binary-codec';

{
  type: 'bitmask',
  byteOffset: 0,
  byteLength: 2,
  map: {
    // Single bits
    flag1: { bits: 0, type: 'boolean' },
    flag2: { bits: 15, type: 'boolean' },

    // Bit ranges
    value: { bits: [7, 4], type: 'uint' },      // bits 7-4 (4 bits)

    // Enum values
    status: {
      bits: [3, 2],
      type: 'enum',
      values: ['idle', 'running', 'error']
    }
  }
}
```

### Array Codec

Repeated elements of the same type:

```ts
import { arrayCodec } from 'binary-codec';

{
  type: 'array',
  byteOffset: 0,
  byteLength: 12,        // total bytes for array
  item: {
    type: 'number',
    numberType: 'uint',
    byteLength: 4        // 12 / 4 = 3 elements
  }
}
```

### Object Codec

Structured data with multiple fields:

```ts
import { objectCodec } from 'binary-codec';

{
  type: 'object',
  byteOffset: 0,
  byteLength: 16,
  fields: [
    {
      name: 'header',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 4
    },
    {
      name: 'payload',
      type: 'string',
      byteOffset: 4,
      byteLength: 12
    }
  ]
}
```

### Raw Codec

Direct byte access:

```ts
import { rawCodec } from 'binary-codec';

{
  type: 'raw',
  byteOffset: 0,
  byteLength: 8
}
// Returns: Uint8Array
```

### Bitset Codec

Boolean array representation:

<!-- eslint-skip -->
```ts
import { bitsetCodec } from 'binary-codec';

{
  type: 'bitset',
  byteOffset: 0,
  byteLength: 2        // 16 bits = 16 boolean values
}
// Returns: boolean[]
```

---

## ✅ Validation System

binary-codec includes a comprehensive validation system that catches configuration errors at runtime:

### Automatic Validation

```ts
import { deserialize } from 'binary-codec';

const spec = {
  fields: [
    {
      name: 'invalid',
      type: 'number',
      numberType: 'float',
      byteOffset: 0,
      byteLength: 3 // ❌ Error: float must be 4 bytes
    }
  ]
};

// Throws ValidationError with detailed information
try {
  deserialize(buffer, spec);
} catch (error) {
  console.log(error.message); // "Invalid combination: float with 3 bytes"
  console.log(error.path); // "fields[0]"
  console.log(error.code); // "INVALID_NUMBER_TYPE_LENGTH"
}
```

### Manual Validation

```ts
import { createRegistry, validateCodecSpec } from 'binary-codec';

const registry = createRegistry();
const results = validateCodecSpec(spec, registry);

results.forEach(result => {
  console.log(`${result.level}: ${result.message} at ${result.path}`);
});
```

### Validation Levels

- **FATAL**: Critical errors that prevent operation
- **ERROR**: Serious issues that should be fixed
- **WARNING**: Potential problems worth noting
- **INFO**: Informational messages

### Recursive Validation

The validation system automatically validates nested structures:

```ts
const complexSpec = {
  fields: [
    {
      name: 'data',
      type: 'array',
      byteOffset: 0,
      byteLength: 8,
      item: {
        type: 'bitmask',
        byteLength: 2,
        map: {
          invalid: {
            bits: 20, // ❌ Error: exceeds 16 bits
            type: 'boolean'
          }
        }
      }
    }
  ]
};

// Error path: "fields[0].item.map.invalid"
```

---

## 🔧 Custom Codecs

Extend the library with your own codecs:

```ts
import { Codec, ValidationLevel } from 'binary-codec';

// Define your codec
const customCodec: Codec<CustomSpec, CustomType> = {
  type: 'custom',
  read: (view, spec, ctx) => {
    // Your read implementation
  },
  write: (view, spec, value, ctx) => {
    // Your write implementation
  },
  validate: (spec, path, ctx) => {
    // Optional validation
    const results = [];
    if (/* invalid condition */) {
      results.push({
        level: ValidationLevel.ERROR,
        message: 'Custom validation error',
        path,
        code: 'CUSTOM_ERROR'
      });
    }
    return results;
  }
};

// Register it
const registry = createRegistry();
registry.install(customCodec);
```

---

## 🧠 Type Inference

Get precise TypeScript types automatically from your configuration:

```ts
import { Infer } from 'binary-codec';

const packetSpec = {
  byteLength: 13,
  fields: [
    {
      name: 'id',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 4
    },
    {
      name: 'flags',
      type: 'bitmask',
      byteOffset: 4,
      byteLength: 1,
      map: {
        active: {
          bits: 0,
          type: 'boolean'
        },
        priority: {
          bits: [3, 1],
          type: 'uint'
        }
      }
    },
    {
      name: 'items',
      type: 'array',
      byteOffset: 5,
      byteLength: 8,
      item: {
        type: 'number',
        numberType: 'uint',
        byteLength: 2
      }
    }
  ]
} as const satisfies CodecSpec;

// Automatically inferred type:
type PacketType = Infer<typeof packetSpec>;
// {
//   id: number;
//   flags: { active: boolean; priority: number };
//   items: number[];
// }
```

---

## 🌐 Browser & Node.js

Works seamlessly in both environments:

```ts
// Node.js
import fs from 'node:fs';
import { deserialize } from 'binary-codec';

const buffer = fs.readFileSync('data.bin');
const data = deserialize(buffer, spec);

// Browser
fetch('/api/data')
  .then(response => response.arrayBuffer())
  .then(buffer => deserialize(buffer, spec));
```

---

## 📊 Performance

- **Zero dependencies** – minimal bundle size
- **Efficient operations** – direct `DataView` manipulation
- **Type-safe** – compile-time type checking
- **Memory efficient** – no intermediate object creation during serialization

---

## 🔄 Endianness

Control byte order for multi-byte values:

```ts
{
  type: 'number',
  numberType: 'uint',
  byteLength: 4,
  littleEndian: true  // default: false (big-endian)
}
```

---

## 📝 Examples

### Network Protocol Parsing

```ts
import type { CodecSpec } from 'binary-codec';

const tcpHeaderSpec = {
  byteLength: 14,
  fields: [
    {
      name: 'srcPort',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 2
    },
    {
      name: 'dstPort',
      type: 'number',
      numberType: 'uint',
      byteOffset: 2,
      byteLength: 2
    },
    {
      name: 'seqNum',
      type: 'number',
      numberType: 'uint',
      byteOffset: 4,
      byteLength: 4
    },
    {
      name: 'ackNum',
      type: 'number',
      numberType: 'uint',
      byteOffset: 8,
      byteLength: 4
    },
    {
      name: 'flags',
      type: 'bitmask',
      byteOffset: 13,
      byteLength: 1,
      map: {
        fin: {
          bits: 0,
          type: 'boolean'
        },
        syn: {
          bits: 1,
          type: 'boolean'
        },
        rst: {
          bits: 2,
          type: 'boolean'
        },
        psh: {
          bits: 3,
          type: 'boolean'
        },
        ack: {
          bits: 4,
          type: 'boolean'
        },
        urg: {
          bits: 5,
          type: 'boolean'
        }
      }
    }
  ]
} as const satisfies CodecSpec;

const header = deserialize(packetBuffer, tcpHeaderSpec);
console.log(header.flags.syn); // boolean
```

### File Format Parsing

```ts
const bmpHeaderSpec = {
  byteLength: 26,
  fields: [
    {
      name: 'signature',
      type: 'string',
      byteOffset: 0,
      byteLength: 2
    },
    {
      name: 'fileSize',
      type: 'number',
      numberType: 'uint',
      byteOffset: 2,
      byteLength: 4,
      littleEndian: true
    },
    {
      name: 'dataOffset',
      type: 'number',
      numberType: 'uint',
      byteOffset: 10,
      byteLength: 4,
      littleEndian: true
    },
    {
      name: 'width',
      type: 'number',
      numberType: 'uint',
      byteOffset: 18,
      byteLength: 4,
      littleEndian: true
    },
    {
      name: 'height',
      type: 'number',
      numberType: 'uint',
      byteOffset: 22,
      byteLength: 4,
      littleEndian: true
    }
  ]
} as const;

const bmpHeader = deserialize(fileBuffer, bmpHeaderSpec);
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
