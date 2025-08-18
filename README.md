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

### Basic number/string

```ts
import { numberCodec, stringCodec } from 'binary-codec';

// Create a buffer
const buffer = new ArrayBuffer(16);
const view = new DataView(buffer);

// Write a uint32
numberCodec.write(view, {
  numberType: 'uint',
  byteOffset: 0,
  byteLength: 4
}, 42);

// Read it back
const value = numberCodec.read(view, {
  numberType: 'uint',
  byteOffset: 0,
  byteLength: 4
});
console.log(value); // 42

// Encode a fixed-length string
stringCodec.write(view, {
  byteOffset: 4,
  byteLength: 8
}, 'hello');
const str = stringCodec.read(view, {
  byteOffset: 4,
  byteLength: 8
});
console.log(str); // "hello"
```

### 🔮 Type inference from config

```ts
import { objectCodec } from 'binary-codec';

const packetFormat = {
  type: 'object',
  fields: [
    {
      name: 'id',
      type: 'uint8',
      byteOffset: 0,
      byteLength: 1
    },
    {
      name: 'value',
      type: 'uint16',
      byteOffset: 1,
      byteLength: 2
    },
    {
      name: 'flag',
      type: 'bitmask',
      byteOffset: 3,
      byteLength: 1,
      map: {
        a: 0,
        b: 1
      }
    }
  ]
} as const;

// ✅ The return type is automatically inferred:
//    { id: number; value: number; flag: { a: boolean; b: boolean } }
const parsed = objectCodec.read(new DataView(new ArrayBuffer(4)), packetFormat);
```

---

## 📖 API Overview

Each codec has the following shape:

```ts
interface Codec<Spec, T> {
  type: string
  read: (view: DataView, spec: Spec, ctx?: CodecContext) => T
  write?: (view: DataView, spec: Spec, value: T, ctx?: CodecContext) => void
}
```

Available built-in codecs:

* `rawCodec` – read/write raw bytes
* `numberCodec` – integers, signed/unsigned, configurable byte length
* `stringCodec` – fixed-length strings (UTF-8)
* `bitmaskCodec` – bitfield extraction/mapping
* `arrayCodec` – repeated elements
* `objectCodec` – structured field groups (with type inference ✨)
