import type { CodecRegistry } from './registry.ts';
import { arrayCodec } from '../codecs/array.ts';
import { bitmaskCodec } from '../codecs/bitmask.ts';
import { numberCodec } from '../codecs/number.ts';
import { objectCodec } from '../codecs/object.ts';
import { rawCodec } from '../codecs/raw.ts';
import { stringCodec } from '../codecs/string.ts';

export function installAll(registry: CodecRegistry): void {
  registry.install(rawCodec);
  registry.install(stringCodec);
  registry.install(numberCodec);
  registry.install(arrayCodec);
  registry.install(bitmaskCodec);
  registry.install(objectCodec);
}
