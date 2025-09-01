# Bitmask Codec

The **bitmask codec** extracts structured data from individual bits and bit ranges within a numeric value. It allows you to define named fields that map to specific bit positions, making it perfect for packed data structures and control registers.

## Overview

- **Type**: `'bitmask'`
- **Returns**: `Record<string, boolean | number | string>`
- **Dependencies**: Number codec (reads/writes as uint)
- **Use Cases**: Control registers, packed flags, protocol headers, hardware interfaces

## Basic Usage

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const spec = {
  byteLength: 2,
  fields: [
    {
      name: 'control',
      type: 'bitmask',
      byteOffset: 0,
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
  ]
} as const satisfies CodecSpec;

// Serialize structured data to buffer
const data = {
  control: {
    enabled: true,
    priority: 5,
    status: 'active'
  }
};
const buffer = serialize(spec, data);

// Deserialize back - hover over result to see the type
const result = deserialize(spec, buffer);
console.log(result.control.enabled); // boolean
console.log(result.control.priority); // number
console.log(result.control.status); // string
```

## Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | ✅ | Field identifier |
| `type` | `'bitmask'` | ✅ | Must be `'bitmask'` |
| `byteOffset` | `number` | ✅ | Position in buffer (0-based) |
| `byteLength` | `1 \| 2 \| 4` | ✅ | Number of bytes for the bitmask |
| `map` | `BitmaskMap` | ✅ | Mapping of field names to bit specifications |
| `littleEndian` | `boolean` | ❌ | Byte order (default: `false` for big-endian) |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const spec = {
  byteLength: 4,
  fields: [
    {
      name: 'register',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 4, // 32-bit register
      littleEndian: true, // Little-endian byte order
      map: {
        version: {
          bits: [31, 28],
          type: 'uint'
        },
        flags: {
          bits: 0,
          type: 'boolean'
        }
      }
    }
  ]
} as const satisfies CodecSpec;
```

## Bit Field Types

### Boolean Fields

Map single bits to boolean values:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const flagsSpec = {
  byteLength: 1,
  fields: [
    {
      name: 'flags',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 1,
      map: {
        enabled: {
          bits: 0,
          type: 'boolean'
        }, // Bit 0
        visible: {
          bits: 1,
          type: 'boolean'
        }, // Bit 1
        locked: {
          bits: 7,
          type: 'boolean'
        } // Bit 7
      }
    }
  ]
} as const satisfies CodecSpec;

const data = {
  flags: {
    enabled: true, // Bit 0 = 1
    visible: false, // Bit 1 = 0
    locked: true // Bit 7 = 1
  }
};

const buffer = serialize(flagsSpec, data);
console.log(buffer[0]); // 129 (binary: 10000001)

const result = deserialize(flagsSpec, buffer);
// Type: { flags: { enabled: boolean, visible: boolean, locked: boolean } }
```

### Unsigned Integer Fields

Extract numeric values from bit ranges:

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const registerSpec = {
  byteLength: 2,
  fields: [
    {
      name: 'control',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 2,
      map: {
        version: {
          bits: [15, 12], // 4 bits: range 0-15
          type: 'uint'
        },
        command: {
          bits: [11, 8], // 4 bits: range 0-15
          type: 'uint'
        },
        flags: {
          bits: [7, 0], // 8 bits: range 0-255
          type: 'uint'
        }
      }
    }
  ]
} as const satisfies CodecSpec;

// Type inferred as:
// { control: { version: number, command: number, flags: number } }
```

### Enum Fields

Map bit values to string constants:

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const protocolSpec = {
  byteLength: 1,
  fields: [
    {
      name: 'header',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 1,
      map: {
        messageType: {
          bits: [7, 6], // 2 bits = 4 possible values
          type: 'enum',
          values: ['request', 'response', 'notification', 'error']
        },
        priority: {
          bits: [5, 3], // 3 bits = 8 possible values
          type: 'enum',
          values: ['low', 'normal', 'high', 'urgent', 'critical', 'emergency', 'reserved1', 'reserved2']
        },
        compression: {
          bits: 2, // Single bit
          type: 'enum',
          values: ['none', 'gzip']
        }
      }
    }
  ]
} as const satisfies CodecSpec;

const message = {
  header: {
    messageType: 'request',
    priority: 'high',
    compression: 'gzip'
  }
};

const buffer = serialize(protocolSpec, message);
const parsed = deserialize(protocolSpec, buffer);
// Type: { header: { messageType: string, priority: string, compression: string } }
```

## Bit Positioning

### Single Bit Position

Use a number to specify a single bit:

<!-- eslint-skip -->
```ts
{
  enabled: {
    bits: 3,           // Bit position 3
    type: 'boolean'
  }
}
```

### Bit Range

Use a tuple `[high, low]` to specify a bit range (inclusive):

<!-- eslint-skip -->
```ts
{
  value: {
    bits: [7, 4],      // Bits 7, 6, 5, 4 (4 bits total)
    type: 'uint'
  }
}
```

Bit numbering starts from 0 (least significant bit):

```ts
// For a 16-bit value: 0b1111000011110000
//                     ↑              ↑
//                   bit 15         bit 0
//
// Range [15, 12] = 0b1111 = 15
// Range [11, 8]  = 0b0000 = 0
// Range [7, 4]   = 0b1111 = 15
// Range [3, 0]   = 0b0000 = 0
```

## Error Handling

The bitmask codec performs validation at different stages:

### Specification Validation

This validation occurs during **both** deserialization and serialization:

| Error Code | Level | Description |
|------------|-------|-------------|
| `BIT_OUT_OF_RANGE` | **FATAL** | Bit position exceeds field size |
| `INVALID_BIT_RANGE` | **ERROR** | Bit range has high < low |
| `TOO_MANY_ENUM_VALUES` | **ERROR** | Too many enum values for bit width |

```ts twoslash
import type { CodecSpec } from 'binary-codec';

// ❌ These specs will cause validation errors
const invalidSpecs = [
  // BIT_OUT_OF_RANGE
  {
    byteLength: 1, // Only 8 bits (0-7)
    fields: [
      {
        name: 'flags',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          flag: {
            bits: 8, // Bit 8 doesn't exist
            type: 'boolean'
          }
        }
      }
    ]
  },

  // INVALID_BIT_RANGE
  {
    byteLength: 2,
    fields: [
      {
        name: 'control',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 2,
        map: {
          value: {
            bits: [3, 5], // High (3) < Low (5)
            type: 'uint'
          }
        }
      }
    ]
  },

  // TOO_MANY_ENUM_VALUES
  {
    byteLength: 1,
    fields: [
      {
        name: 'status',
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          level: {
            bits: [1, 0], // 2 bits = max 4 values
            type: 'enum',
            values: ['a', 'b', 'c', 'd', 'e'] // 5 values!
          }
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
| `INVALID_BITMASK_DATA_TYPE` | **FATAL** | Data must be an object |
| `INVALID_BOOLEAN_FIELD` | **ERROR** | Boolean field must be boolean |
| `INVALID_UINT_FIELD` | **ERROR** | Uint field must be non-negative integer |
| `VALUE_OUT_OF_RANGE` | **ERROR** | Value exceeds bit range capacity |
| `INVALID_ENUM_FIELD_TYPE` | **ERROR** | Enum field must be string |
| `INVALID_ENUM_VALUE` | **ERROR** | String not found in enum values |

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 1,
  fields: [
    {
      name: 'flags',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 1,
      map: {
        enabled: {
          bits: 0,
          type: 'boolean'
        },
        level: {
          bits: [3, 1],
          type: 'uint'
        },
        status: {
          bits: [7, 6],
          type: 'enum',
          values: ['ok', 'warning', 'error']
        }
      }
    }
  ]
} as const satisfies CodecSpec;

// ❌ INVALID_BITMASK_DATA_TYPE: not an object
// const result1 = serialize(spec, { flags: "not object" })

// ❌ INVALID_BOOLEAN_FIELD: not boolean
// const result2 = serialize(spec, { flags: { enabled: "yes" } })

// ❌ VALUE_OUT_OF_RANGE: exceeds 3-bit range (0-7)
// const result3 = serialize(spec, { flags: { level: 8 } })

// ❌ INVALID_ENUM_VALUE: not in values array
// const result4 = serialize(spec, { flags: { status: "invalid" } })

// ✅ Valid data
const result = serialize(spec, {
  flags: {
    enabled: true,
    level: 5,
    status: 'warning'
  }
});
```

## Real-World Examples

### Network Packet Header

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { deserialize, serialize } from 'binary-codec';

const packetSpec = {
  byteLength: 2,
  fields: [
    {
      name: 'header',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 2,
      map: {
        version: {
          bits: [15, 12], // 4 bits: protocol version
          type: 'uint'
        },
        messageType: {
          bits: [11, 8], // 4 bits: message type
          type: 'enum',
          values: [
            'data',
            'ack',
            'nack',
            'ping',
            'pong',
            'connect',
            'disconnect',
            'heartbeat'
          ]
        },
        priority: {
          bits: [7, 6], // 2 bits: priority level
          type: 'enum',
          values: ['low', 'normal', 'high', 'urgent']
        },
        compressed: {
          bits: 5,
          type: 'boolean'
        },
        encrypted: {
          bits: 4,
          type: 'boolean'
        },
        sequenceId: {
          bits: [3, 0], // 4 bits: sequence number
          type: 'uint'
        }
      }
    }
  ]
} as const satisfies CodecSpec;

const packet = {
  header: {
    version: 2,
    messageType: 'data',
    priority: 'high',
    compressed: true,
    encrypted: false,
    sequenceId: 7
  }
};

const buffer = serialize(packetSpec, packet);
const parsed = deserialize(packetSpec, buffer);
// Type: { header: { version: number, messageType: string, priority: string, ... } }
```

### CPU Status Register

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const cpuStatusSpec = {
  byteLength: 4,
  fields: [
    {
      name: 'status',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 4,
      map: {
        carryFlag: {
          bits: 0,
          type: 'boolean'
        },
        zeroFlag: {
          bits: 1,
          type: 'boolean'
        },
        interruptEnable: {
          bits: 2,
          type: 'boolean'
        },
        processorMode: {
          bits: [4, 3],
          type: 'enum',
          values: ['user', 'supervisor', 'kernel', 'hypervisor']
        },
        exceptionCode: {
          bits: [15, 8],
          type: 'uint'
        },
        processId: {
          bits: [31, 16],
          type: 'uint'
        }
      }
    }
  ]
} as const satisfies CodecSpec;

// Type inferred as:
// { status: { carryFlag: boolean, processorMode: string, processId: number, ... } }
```

## Optional Fields

Bitmask fields can be undefined during serialization (they default to 0):

```ts twoslash
import type { CodecSpec } from 'binary-codec';
import { serialize } from 'binary-codec';

const spec = {
  byteLength: 1,
  fields: [
    {
      name: 'config',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 1,
      map: {
        enabled: {
          bits: 0,
          type: 'boolean'
        },
        level: {
          bits: [3, 1],
          type: 'uint'
        }
      }
    }
  ]
} as const satisfies CodecSpec;

// Partial data - missing fields default to 0/false
const partialData = {
  config: {
    enabled: true
    // level is undefined - will be 0
  }
};

const buffer = serialize(spec, partialData);
```

## Supported Byte Lengths

Currently limited to 1, 2, or 4 bytes (due to number codec dependency):

```ts twoslash
import type { CodecSpec } from 'binary-codec';

const validSizes = [
  {
    byteLength: 1
  }, // 8 bits
  {
    byteLength: 2
  }, // 16 bits
  {
    byteLength: 4
  } // 32 bits
] as const;

// const invalidSize = { byteLength: 3 }  // Not supported
```

## Next Steps

Now that you understand the bitmask codec, continue with:

- [Array Codec](/guide/advanced/array) - Repeating structures
- [Object Codec](/guide/advanced/object) - Complex nested structures
