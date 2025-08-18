import type { CodecRegistry } from './registry/registry.ts';
import type { CodecSpec, Infer } from './types.ts';
import { getDefaultRegistry } from './registry/default.ts';

export function deserialize<TSpec extends CodecSpec>(
  codecSpec: TSpec,
  buffer: Uint8Array,
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

export function serialize(
  codecSpec: CodecSpec,
  value: Record<string, any>,
  registry: CodecRegistry = getDefaultRegistry()
): Uint8Array {
  const { byteLength, littleEndian = false } = codecSpec;
  const u8Arr = new Uint8Array(byteLength);
  const view = new DataView(u8Arr.buffer);

  registry.get('object').write!(
    view,
    {
      ...codecSpec,
      byteOffset: 0,
      littleEndian
    },
    value,
    registry.resolver()
  );

  return u8Arr;
}
