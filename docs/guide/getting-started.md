# Getting Started

## Features

- 🚀 **Type-Safe**: Full TypeScript support with automatic type inference
- 📦 **Lightweight**: Zero dependencies, minimal bundle size
- 🔧 **Flexible**: Support for various binary data formats
- 🎯 **Developer-Friendly**: IntelliSense support and compile-time validation

## Installation

Install Binary Codec via npm, yarn, or pnpm:

::: code-group

```bash [npm]
npm install binary-codec
```

```bash [yarn]
yarn add binary-codec
```

```bash [pnpm]
pnpm add binary-codec
```

:::

## Your First Binary Codec

Let's create a simple packet decoder to understand the basics:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

// Define a packet structure using CodecSpec
const packetSpec = {
  byteLength: 10,
  fields: [
    {
      name: 'magic',
      type: 'number',
      numberType: 'uint',
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
      name: 'payload',
      type: 'raw',
      byteOffset: 6,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// ✨ Hover over Packet to see the inferred type
type Packet = Infer<typeof packetSpec>;
```

## Key Concepts

### 1. **Type Inference**

The most powerful feature of Binary Codec is automatic type inference:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const spec = {
  byteLength: 5,
  fields: [
    {
      name: 'count',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 1
    },
    {
      name: 'name',
      type: 'string',
      byteOffset: 1,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// No manual type definitions needed! Hover over Result to see the type
type Result = Infer<typeof spec>;
```

### 2. **Best Practice: `as const satisfies CodecSpec`**

Always use this pattern for optimal type inference:

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ✅ Correct - enables full type inference
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

// ❌ Avoid - loses type information
const badSpec: CodecSpec = {
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
};
```

## Serialization and Deserialization

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
      name: 'name',
      type: 'string',
      byteOffset: 2,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

// Serialize data to binary
const data = {
  id: 42,
  name: 'test'
};
const buffer = serialize(spec, data);

// Deserialize binary back to data - hover to see inferred type
const result = deserialize(spec, buffer);

console.log(result); // { id: 42, name: 'test' }
```

## Next Steps

Now that you understand the basics, dive deeper into:

- [Core Concepts](/guide/core-concepts) - Learn about the codec system
- [Raw Codec](/guide/basic-types/raw) - Start with the most fundamental type
- [API Reference](/api/) - Complete API documentation
