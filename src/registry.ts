import type { Codec, MetaField } from './types';
import { arrayCodec } from './codecs/array';
import { bitmaskCodec } from './codecs/bitmask';
import { numberCodec } from './codecs/number';
import { rawCodec } from './codecs/raw';
import { stringCodec } from './codecs/string';

export class CodecRegistry {
  private map = new Map<string, Codec<any, any>>();

  install<Spec extends MetaField, T>(codec: Codec<Spec, T>): void {
    if (this.map.has(codec.type)) {
      console.warn(`Codec "${codec.type}" is already registered, overwriting.`);
    }
    this.map.set(codec.type, codec);
  }

  get<Spec extends MetaField, T = any>(type: string): Codec<Spec, T> {
    const c = this.map.get(type);
    if (!c) {
      throw new Error(`Codec not found for type: "${type}"`);
    }
    return c as Codec<Spec, T>;
  }

  listTypes(): string[] {
    return Array.from(this.map.keys());
  }
}

export const registry = new CodecRegistry();

registry.install(rawCodec);
registry.install(stringCodec);
registry.install(numberCodec);
registry.install(bitmaskCodec);
registry.install(arrayCodec);
