export function toView(bytes: number[]) {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return new DataView(buffer);
}