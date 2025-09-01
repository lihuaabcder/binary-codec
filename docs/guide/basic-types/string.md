# String Codec

The **string codec** handles text encoding and decoding, built on top of the raw codec. It converts text to/from binary data using configurable character encodings.

## Overview

- **Type**: `'string'`
- **Returns**: `string`
- **Dependencies**: Raw codec (uses raw bytes internally)
- **Use Cases**: Text data, file names, messages, identifiers

## Basic Usage

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const spec = {
  byteLength: 10,
  fields: [
    {
      name: 'message',
      type: 'string',
      byteOffset: 0,
      byteLength: 10
    }
  ]
} as const satisfies CodecSpec;

// Serialize text to buffer
const data = {
  message: 'Hello'
};
const buffer = serialize(spec, data);

// Deserialize back - hover over result to see the type
const result = deserialize(spec, buffer);
console.log(result.message); // "Hello"
```

## Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Field identifier |
| `type` | `'string'` | ✅ | Must be `'string'` |
| `byteOffset` | `number` | ✅ | Position in buffer (0-based) |
| `byteLength` | `number` | ✅ | Maximum bytes for encoded string |
| `encoding` | `string` | ❌ | Text encoding (default: `'utf-8'`) |
| `trimNull` | `boolean` | ❌ | Remove null terminators (default: `true`) |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const spec = {
  byteLength: 20,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 20,
      encoding: 'utf-8', // Character encoding
      trimNull: true // Remove null terminators
    }
  ]
} as const satisfies CodecSpec;
```

## Text Encoding

The string codec supports any encoding supported by the Web platform's `TextEncoder`/`TextDecoder`:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const utf16Spec = {
  byteLength: 20,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 20,
      encoding: 'utf-16le' // Little-endian UTF-16
    }
  ]
} as const satisfies CodecSpec;

const data = {
  text: 'Hello 世界'
};
const buffer = serialize(utf16Spec, data);
```

## Null Termination

By default, the string codec removes null terminators (`\0`) from decoded strings:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

const spec = {
  byteLength: 8,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 8,
      trimNull: true // Default behavior
    }
  ]
} as const satisfies CodecSpec;

// Buffer contains "Hi\0\0\0\0\0\0"
const buffer = new Uint8Array([0x48, 0x69, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const result = deserialize(spec, buffer);
console.log(result.text); // "Hi" (null bytes removed)
```

To preserve null bytes, set `trimNull: false`:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize } from 'binary-codec';

const spec = {
  byteLength: 8,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 8,
      trimNull: false // Preserve null bytes
    }
  ]
} as const satisfies CodecSpec;

const buffer = new Uint8Array([0x48, 0x69, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const result = deserialize(spec, buffer);
console.log(result.text); // "Hi\0\0\0\0\0\0" (null bytes preserved)
```

## Length Handling

### Automatic Truncation

During serialization, strings longer than `byteLength` are automatically truncated:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const spec = {
  byteLength: 5,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 5
    }
  ]
} as const satisfies CodecSpec;

// String is longer than 5 bytes
const data = {
  text: 'Hello World'
};
const buffer = serialize(spec, data);
const result = deserialize(spec, buffer);
console.log(result.text); // "Hello" (truncated to 5 bytes)
```

### Padding with Null Bytes

Short strings are padded with null bytes to fill the allocated space:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 8,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 8
    }
  ]
} as const satisfies CodecSpec;

const data = {
  text: 'Hi'
};
const buffer = serialize(spec, data);
console.log(Array.from(buffer)); // [72, 105, 0, 0, 0, 0, 0, 0] ("Hi" + null padding)
```

## Error Handling

The string codec performs validation at different stages:

### Specification Validation

This validation occurs during **both** deserialization and serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_ENCODING` | **ERROR** | Invalid encoding specified |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ❌ This spec will cause ERROR validation
const invalidSpec = {
  byteLength: 10,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 10,
      encoding: 'invalid-encoding' // INVALID_ENCODING
    }
  ]
} as const satisfies CodecSpec;
```

### Data Validation

This validation occurs **only** during serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `INVALID_STRING_DATA_TYPE` | **FATAL** | Data must be a string |
| `STRING_TOO_LONG` | **WARNING** | Encoded string exceeds `byteLength` |
| `STRING_ENCODING_ERROR` | **ERROR** | Failed to encode string |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 5,
  fields: [
    {
      name: 'text',
      type: 'string',
      byteOffset: 0,
      byteLength: 5
    }
  ]
} as const satisfies CodecSpec;

// ❌ INVALID_STRING_DATA_TYPE: not a string
// const result1 = serialize(spec, { text: 123 })

// ⚠️ STRING_TOO_LONG: warning but continues
const result2 = serialize(spec, {
  text: 'Hello World'
}); // Truncated to "Hello"

// ✅ Valid data
const result = serialize(spec, {
  text: 'Hello'
});
```

## Real-World Examples

### File Name Field

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const fileEntrySpec = {
  byteLength: 260,
  fields: [
    {
      name: 'fileName',
      type: 'string',
      byteOffset: 0,
      byteLength: 255,
      trimNull: true
    },
    {
      name: 'fileSize',
      type: 'number',
      numberType: 'uint',
      byteOffset: 255,
      byteLength: 4
    },
    {
      name: 'reserved',
      type: 'raw',
      byteOffset: 259,
      byteLength: 1
    }
  ]
} as const satisfies CodecSpec;

const fileData = {
  fileName: 'document.pdf',
  fileSize: 1024,
  reserved: new Uint8Array([0])
};

const buffer = serialize(fileEntrySpec, fileData);
const parsed = deserialize(fileEntrySpec, buffer);
console.log(parsed.fileName); // "document.pdf"
```

### Multi-language Text

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const messageSpec = {
  byteLength: 100,
  fields: [
    {
      name: 'english',
      type: 'string',
      byteOffset: 0,
      byteLength: 50,
      encoding: 'utf-8'
    },
    {
      name: 'chinese',
      type: 'string',
      byteOffset: 50,
      byteLength: 50,
      encoding: 'utf-8'
    }
  ]
} as const satisfies CodecSpec;

// Type is automatically inferred as { english: string, chinese: string }
```

## Next Steps

Now that you understand the string codec, continue with:

- [Number Codec](/guide/basic-types/number) - Numeric data handling
- [Bitset Codec](/guide/advanced/bitset) - Bit manipulation
- [Bitmask Codec](/guide/advanced/bitmask) - Bit field extraction
