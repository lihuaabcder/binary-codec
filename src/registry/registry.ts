import type { Codec, MetaField, Resolver } from '../types';

export class CodecRegistry {
  private map = new Map<string, Codec<any, any>>();

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

  resolver(): Resolver {
    return {
      get: (type: string) => this.get(type)
    };
  }
}
