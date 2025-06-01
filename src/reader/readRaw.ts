export function readRaw(
  view: DataView,
  byteOffset: number,
  byteLength?: number
): Uint8Array {
  return new Uint8Array(view.buffer, byteOffset, byteLength);
}