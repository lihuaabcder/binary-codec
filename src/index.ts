import type { CodecRegistry } from './registry/registry';
import type { CodecSpec, Infer } from './types';
import { getDefaultRegistry } from './registry/default';

export function deserialize<TSpec extends CodecSpec>(
  buffer: Uint8Array,
  codecSpec: TSpec,
  registry: CodecRegistry = getDefaultRegistry()
): Infer<TSpec> {
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );

  const { littleEndian = false } = codecSpec;

  return registry.get('object').read(
    view,
    {
      ...codecSpec,
      byteOffset: 0,
      littleEndian
    },
    registry.resolver()
  ) as Infer<TSpec>;
}
