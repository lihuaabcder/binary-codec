import type { Codec, Resolver } from '../src/types';
import { CodecRegistry } from '../src/registry/registry';

export const u8 = (a: number[]) => new Uint8Array(a);

export function toView(bytes: number[]) {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return new DataView(buffer);
}

export function toPlainView(length: number) {
  const emptyArray = Array.from<number>({
    length
  }).fill(0);
  return toView(emptyArray);
}

export function viewToArray(view: DataView<ArrayBuffer>) {
  return bufferToArray(view.buffer);
}

export function bufferToArray(buffer: ArrayBuffer) {
  return new Uint8Array(buffer);
}

export const dummyCtx: Resolver = {
  get: (() => {
    throw new Error('codec should not call ctx.get');
  }) as any
};

export function createTestRegistry(codecs: Codec<any, any>[]) {
  const reg = new CodecRegistry();
  codecs.forEach(codec => reg.install(codec));
  return reg;
}
