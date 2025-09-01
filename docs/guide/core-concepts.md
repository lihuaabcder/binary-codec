# Core Concepts

## Field Specifications

Fields define how data is structured in binary format. Every field must specify:

- **`name`**: Field identifier
- **`type`**: Codec type to use
- **`byteOffset`**: Position in buffer
- **`byteLength`**: Size in bytes

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const spec = {
  byteLength: 8,
  fields: [
    {
      name: 'header', // Field name
      type: 'number', // Codec type
      numberType: 'uint',
      byteOffset: 0, // Start position
      byteLength: 4 // Size in bytes
    },
    {
      name: 'data',
      type: 'raw',
      byteOffset: 4,
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;
```

## The `as const satisfies` Pattern

This TypeScript pattern is **crucial** for proper type inference:

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ✅ CORRECT: Full type inference preserved
const goodSpec = {
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

// ❌ WRONG: Type information lost
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

### Why This Matters

- **`as const`**: Preserves literal types and makes the object readonly
- **`satisfies CodecSpec`**: Ensures type safety while preserving exact structure
- **Together**: Enables precise type inference without losing information

## Type Inference Magic

The core feature of Binary Codec is **automatic type inference** from your field specifications.

### The `Infer` Type

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';

const messageSpec = {
  byteLength: 7,
  fields: [
    {
      name: 'id',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 2
    },
    {
      name: 'text',
      type: 'string',
      byteOffset: 2,
      byteLength: 5
    }
  ]
} as const satisfies CodecSpec;

// Hover over Message to see the inferred structure
type Message = Infer<typeof messageSpec>;
```

### Function Return Type Inference

The deserialize function automatically returns the correctly typed result:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

const spec = {
  byteLength: 3,
  fields: [
    {
      name: 'count',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 1
    },
    {
      name: 'flags',
      type: 'raw',
      byteOffset: 1,
      byteLength: 2
    }
  ]
} as const satisfies CodecSpec;

const buffer = new Uint8Array(3);
// Hover over result to see the inferred type
const result = deserialize(spec, buffer);

// TypeScript knows the exact structure
console.log(result.count); // number
console.log(result.flags); // Uint8Array
```

## Registry and Codec System

Binary Codec uses a **registry-based architecture** where codecs are registered and resolved at runtime.

### Entry Functions with Default Registry

Binary Codec provides two main entry functions that automatically use the default registry:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, getDefaultRegistry, serialize } from 'binary-codec';

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

// These functions automatically use the default registry
const data = {
  value: 42
};
const buffer = serialize(spec, data); // Uses default registry
const result = deserialize(spec, buffer); // Uses default registry

// The default registry includes all built-in codecs
const registry = getDefaultRegistry();
console.log(registry.listTypes());
// ['raw', 'string', 'number', 'array', 'bitmask', 'bitset', 'object']
```

### Custom Registry (Advanced)

For advanced use cases, you can create custom registries:

```ts twoslash
import { CodecRegistry } from 'binary-codec';

// Create a custom registry
const customRegistry = new CodecRegistry();

// Register only specific codecs you need
// customRegistry.install(rawCodec)
// customRegistry.install(numberCodec)

// Use with entry functions
// const result = deserialize(spec, buffer, customRegistry)
```

::: tip
Most users should use the default registry and entry functions. Custom registries are for advanced scenarios like plugin systems or minimal bundles.
:::

## Codec Dependencies

Codecs have dependencies on each other, creating a learning hierarchy:

- **`raw`** - Foundation codec, no dependencies
- **`string`** - Built on `raw` for text encoding
- **`number`** - Independent numeric data handling
- **`array`** - Can contain any non-array codec
- **`bitset`** - Independent bit manipulation
- **`bitmask`** - Independent bit field extraction
- **`object`** - Can contain any other codec

Understanding these dependencies helps you:

- Learn codecs in the right order
- Understand how complex types are built
- Debug type inference issues

## Validation System

Binary Codec includes a comprehensive validation system with different severity levels:

### Validation Levels

```ts twoslash
// import { ValidationLevel } from 'binary-codec';

// Available validation levels
enum ValidationLevel {
  FATAL = 'fatal', // Throw error, stop execution
  ERROR = 'error', // Log error, may affect result
  WARNING = 'warning', // Warning, doesn't affect functionality
  INFO = 'info' // Information only
}
```

- **FATAL**: Critical errors that prevent execution (e.g., invalid codec type)
- **ERROR**: Serious issues that may cause incorrect results (e.g., data type mismatch)
- **WARNING**: Issues that don't break functionality (e.g., string too long)
- **INFO**: Informational messages for debugging

### Validation Stages

Binary Codec performs different validations depending on the operation:

#### During Deserialization

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

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

const buffer = new Uint8Array(4);
// Validation during deserialize:
// 1. Basic CodecSpec validation (structure, field bounds)
// 2. Codec-specific validation (via codec.validate)
// 3. Buffer size validation
const result = deserialize(spec, buffer);
```

#### During Serialization

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
      byteLength: 4
    }
  ]
} as const satisfies CodecSpec;

const data = {
  value: 42
};
// Validation during serialize:
// 1. Basic CodecSpec validation (same as deserialize)
// 2. Codec-specific validation (via codec.validate)
// 3. Runtime data validation (via codec.validateData)
const buffer = serialize(spec, data);
```

### Validation Options

```ts twoslash
import type { CodecSpec, ValidationOptions } from 'binary-codec';
import { deserialize } from 'binary-codec';

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

const options: ValidationOptions = {
  validate: true, // Enable validation (default: true)
  throwOnFatal: true, // Throw on fatal errors (default: true)
  onValidation: results => { // Custom validation handler
    console.log('Validation results:', results);
  }
};

const buffer = new Uint8Array(4);
const result = deserialize(spec, buffer, undefined, options);
```

## Customization (Advanced)

Binary Codec supports full customization of both registries and codecs:

- **Custom Codecs**: Create your own data type handlers
- **Custom Registries**: Control which codecs are available
- **Plugin Systems**: Build extensible binary format libraries

::: warning Coming Soon
Detailed customization documentation is currently being prepared. This will cover creating custom codecs, building plugin systems, and advanced registry management.
:::

## Next Steps

Now that you understand the core concepts, let's explore the basic types in dependency order:

- [Raw Codec](/guide/basic-types/raw) - The foundation of all other types
- [String Codec](/guide/basic-types/string) - Text encoding built on raw
- [Number Codec](/guide/basic-types/number) - Numeric data handling
- [Array Codec](/guide/basic-types/array) - Repeating structures
