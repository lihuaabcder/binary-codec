import type { BitmaskField } from "../src/codecs/bitmask";
import type { ArrayField } from "../src/codecs/array";
import type { ObjectField } from "../src/codecs/object";
import type { Infer, InferBitMask, InferArray, InferObject, CodecSpec } from "../src/types";
import { deserialize } from "../src";

// type 1

const field1 = {
  name: "test1",
  type: 'raw',
  byteOffset: 0,
  byteLength: 1,
} as const;

type type1 = Infer<typeof field1>

// type 2
const field2 = {
  name: "test1",
  type: 'number',
  numberType: 'uint',
  byteOffset: 0,
  byteLength: 1,
} as const;

type type2 = Infer<typeof field2>

// type 3
const field3 = {
  name: "test1",
  type: 'string',
  byteOffset: 0,
  byteLength: 1,
} as const;

type type3 = Infer<typeof field3>

// type 4
const field4 = {
  name: 'test1',
  type: 'bitmask',
  byteOffset: 0,
  byteLength: 1,
  map: {
    enabled: {
      bits: 15,
      type: "boolean"
    },
    inverted: {
      bits: 14,
      type: "boolean"
    },
    interface: {
      bits: 7,
      type: 'enum',
      values: [
        'ALARM',       // 00
        'OPEN_CLOSE'   // 01
      ]
    },
    debounce: {
      bits: [4, 0],
      type: "uint"
    },
  }
} as const satisfies BitmaskField;

type type4 = InferBitMask<typeof field4>

// type 5
const field5 = {
  name: 'test1',
  type: 'array',
  byteOffset: 0,
  byteLength: 1,
  item: {
    type: 'bitmask',
    byteOffset: 0,
    byteLength: 1,
    map: {
      enabled: {
        bits: 15,
        type: "boolean"
      },
      inverted: {
        bits: 14,
        type: "boolean"
      },
      interface: {
        bits: 7,
        type: 'enum',
        values: [
          'ALARM',       // 00
          'OPEN_CLOSE'   // 01
        ]
      },
      debounce: {
        bits: [4, 0],
        type: "uint"
      },
    }
  }
} as const satisfies ArrayField;

type type5 = InferArray<typeof field5>

// type 6
const field6 = {
  byteLength: 1,
  fields: [
    {
      name: "raw1",
      type: 'raw',
      byteOffset: 0,
      byteLength: 1,
    },
    {
      name: "number1",
      type: 'number',
      numberType: 'uint',
      byteOffset: 0,
      byteLength: 1,
    },
    {
      name: 'bitmask1',
      type: 'bitmask',
      byteOffset: 0,
      byteLength: 1,
      map: {
        enabled: {
          bits: 15,
          type: "boolean"
        },
        inverted: {
          bits: 14,
          type: "boolean"
        },
        interface: {
          bits: 7,
          type: 'enum',
          values: [
            'ALARM',       // 00
            'OPEN_CLOSE'   // 01
          ]
        },
        debounce: {
          bits: [4, 0],
          type: "uint"
        },
      }
    },
    {
      name: 'array1',
      type: 'array',
      byteOffset: 0,
      byteLength: 1,
      item: {
        type: 'bitmask',
        byteOffset: 0,
        byteLength: 1,
        map: {
          enabled: {
            bits: 15,
            type: "boolean"
          },
          inverted: {
            bits: 14,
            type: "boolean"
          },
          interface: {
            bits: 7,
            type: 'enum',
            values: [
              'ALARM',       // 00
              'OPEN_CLOSE'   // 01
            ]
          },
          debounce: {
            bits: [4, 0],
            type: "uint"
          },
        }
      }
    },
    {
      name: 'object1',
      type: 'object',
      byteOffset: 0,
      byteLength: 1,
      fields: [
        // {
        //   name: "raw1",
        //   type: 'raw',
        //   byteOffset: 0,
        //   byteLength: 1,
        // },
        {
          name: "number1",
          type: 'number',
          numberType: 'uint',
          byteOffset: 0,
          byteLength: 1,
        },
        {
          name: 'bitmask1',
          type: 'bitmask',
          byteOffset: 0,
          byteLength: 1,
          map: {
            enabled: {
              bits: 15,
              type: "boolean"
            },
            inverted: {
              bits: 14,
              type: "boolean"
            },
            interface: {
              bits: 7,
              type: 'enum',
              values: [
                'ALARM',       // 00
                'OPEN_CLOSE'   // 01
              ]
            },
            debounce: {
              bits: [4, 0],
              type: "uint"
            },
          }
        },
        {
          name: 'array1',
          type: 'array',
          byteOffset: 0,
          byteLength: 1,
          item: {
            type: 'bitmask',
            byteOffset: 0,
            byteLength: 1,
            map: {
              enabled: {
                bits: 15,
                type: "boolean"
              },
              inverted: {
                bits: 14,
                type: "boolean"
              },
              interface: {
                bits: 7,
                type: 'enum',
                values: [
                  'ALARM',       // 00
                  'OPEN_CLOSE'   // 01
                ]
              },
              debounce: {
                bits: [4, 0],
                type: "uint"
              },
            }
          }
        },
      ]
    }
  ]
} as const satisfies CodecSpec;

type type6 = Infer<typeof field6>;

type type7 = InferObject<typeof field6>;

const test = deserialize<typeof field6>(new Uint8Array(), field6);