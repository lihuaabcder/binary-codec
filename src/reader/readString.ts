import { readRaw } from "./readRaw";

// TODO emoji
export function readString(
  view: DataView,
  byteOffset: number,
  byteLength?: number,
  encoding = 'utf-8',
  trimNull: boolean = true
): string {
  const decoder = new TextDecoder(
    encoding,
    {
      fatal: false,
      ignoreBOM: false // TODO: BOM compatible
    }
  );

  const bytes = readRaw(view, byteOffset, byteLength);
  const text = decoder.decode(bytes);
  return trimNull ? text.replace(/\0+$/, '') : text;
}