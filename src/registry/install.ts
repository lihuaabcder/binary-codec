import type { CodecRegistry } from './registry';
import { arrayCodec } from '../codecs/array';
import { bitmaskCodec } from '../codecs/bitmask';
import { numberCodec } from '../codecs/number';
import { objectCodec } from '../codecs/object';
import { rawCodec } from '../codecs/raw';
import { stringCodec } from '../codecs/string';

export function installAll(registry: CodecRegistry) {
  registry.install(rawCodec);
  registry.install(stringCodec);
  registry.install(numberCodec);
  registry.install(arrayCodec);
  registry.install(bitmaskCodec);
  registry.install(objectCodec);
}
