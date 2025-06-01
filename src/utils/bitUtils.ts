export function extractBits(value: number, start: number, end: number) {
  const high = Math.max(start, end);
  const low = Math.min(start, end);
  const bitLength = high - low + 1;
  const mask = (1 << bitLength) - 1;
  return (value >> low) & mask;
}