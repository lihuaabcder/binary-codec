import type { Codec, Resolver } from '../src/types.ts';
import { CodecRegistry } from '../src/registry/registry.ts';

export const u8 = (a: number[]): Uint8Array => new Uint8Array(a);

export function toView(bytes: number[]): DataView {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return new DataView(buffer);
}

export function toPlainView(length: number): DataView {
  const emptyArray = Array.from<number>({
    length
  }).fill(0);
  return toView(emptyArray);
}

export function viewToArray(view: DataView<ArrayBufferLike>): number[] {
  return bufferToArray(view.buffer);
}

export function bufferToArray(buffer: ArrayBufferLike): number[] {
  return Array.from(new Uint8Array(buffer));
}

export const dummyCtx: Resolver = {
  get: (() => {
    throw new Error('codec should not call ctx.get');
  }) as any
};

export function createTestRegistry(codecs: Codec<any, any>[]): CodecRegistry {
  const reg = new CodecRegistry();
  codecs.forEach(codec => reg.install(codec));
  return reg;
}
