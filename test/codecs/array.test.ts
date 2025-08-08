import type { ArrayItemField } from '../../src/codecs/array';
import { describe, expect, it } from 'vitest';
import { arrayCodec } from '../../src/codecs/array';
import { toView } from '../helper';

describe('array.write', () => {
  it('should read an array of uint8 values', () => {
    const view = toView([10, 20, 30]);

    const result = arrayCodec.read(
      view,
      {
        byteOffset: 0,
        byteLength: 3,
        item: {
          type: 'number',
          numberType: 'uint',
          byteLength: 1
        }
      }
    );

    expect(result).toEqual([10, 20, 30]);
  });
});
