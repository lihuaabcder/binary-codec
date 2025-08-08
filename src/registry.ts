import type { Codec, MetaField } from './types';
import { arrayCodec } from './codecs/array';
import { bitmaskCodec } from './codecs/bitmask';
import { numberCodec } from './codecs/number';
import { objectCodec } from './codecs/object';
import { rawCodec } from './codecs/raw';
import { stringCodec } from './codecs/string';

export class CodecRegistry {
  private map = new Map<string, Codec<any, any>>([
    [rawCodec.type, rawCodec],
    [stringCodec.type, stringCodec],
    [numberCodec.type, numberCodec],
    [bitmaskCodec.type, bitmaskCodec],
    [arrayCodec.type, arrayCodec],
    [objectCodec.type, objectCodec]
  ]);

  install<Spec extends MetaField<any>, T>(codec: Codec<Spec, T>): void {
    if (this.map.has(codec.type)) {
      console.warn(`Codec "${codec.type}" is already registered, overwriting.`);
    }
    this.map.set(codec.type, codec);
  }

  get<Spec extends MetaField<any>, T = any>(type: string): Codec<Spec, T> {
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
