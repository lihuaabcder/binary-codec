---
layout: home

hero:
  name: "Binary Codec"
  text: "TypeScript Binary Data Library"
  tagline: Lightweight utility with powerful type inference
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/lihuaabcder/binary-codec

features:
  - title: 🚀 Type-Safe
    details: Full TypeScript support with automatic type inference from your specifications
  - title: 📦 Lightweight
    details: Zero dependencies and minimal bundle size for optimal performance
  - title: 🔧 Flexible
    details: Support for various binary data formats with extensible codec system
  - title: 🎯 Developer-Friendly
    details: IntelliSense support and compile-time validation for better DX
---

## Quick Preview

Experience the power of automatic type inference:

```ts twoslash
import type { CodecSpec, Infer } from 'binary-codec';
import { deserialize } from 'binary-codec';

const packetSpec = {
  byteLength: 6,
  fields: [
    {
      name: 'status',
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 1
    },
    {
      name: 'message',
      type: 'string',
      byteOffset: 1,
      byteLength: 5
    }
  ]
} as const satisfies CodecSpec;

// ✨ Hover over PacketType to see the inferred type
type PacketType = Infer<typeof packetSpec>;

const buffer = new Uint8Array(6);
// Hover over result to see the automatically inferred return type
const result = deserialize(packetSpec, buffer);
```
