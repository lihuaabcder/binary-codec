import type { CodecSpec, Infer } from './types';
import { objectCodec } from './codecs/object';

export function deserialize<TSpec extends CodecSpec>(
  buffer: Uint8Array,
  codecSpec: TSpec
): Infer<TSpec> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const { littleEndian = false } = codecSpec;

  return objectCodec.read(
    view,
    {
      ...codecSpec,
      byteOffset: 0,
      littleEndian
    }
  ) as Infer<TSpec>;
}
