import type { CodecRegistry } from '../registry/registry.ts';
import type { CodecSpec, Infer } from '../types.ts';
import type { ValidationOptions } from '../validation/types.ts';
import { getDefaultRegistry } from '../registry/default.ts';
import { processValidationResults, validateBufferSize, validateCodecSpec, validateRuntimeData } from '../validation/validator.ts';

export function deserialize<TSpec extends CodecSpec>(
  codecSpec: TSpec,
  buffer: Uint8Array,
  registry: CodecRegistry = getDefaultRegistry(),
  options: ValidationOptions = {}
): Infer<TSpec> {
  const {
    validate = true,
    onValidation,
    throwOnFatal = true
  } = options;

  // Perform validation if enabled
  if (validate) {
    // Static validation
    const staticResults = validateCodecSpec(codecSpec, registry);

    // Buffer size validation
    const bufferResults = validateBufferSize(codecSpec, buffer);

    // Process all validation results
    const allResults = [...staticResults, ...bufferResults];
    processValidationResults(allResults, throwOnFatal, onValidation);
  }

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
  registry: CodecRegistry = getDefaultRegistry(),
  options: ValidationOptions = {}
): Uint8Array {
  const {
    validate = true,
    onValidation,
    throwOnFatal = true
  } = options;

  // Perform validation if enabled
  if (validate) {
    // Static validation
    const staticResults = validateCodecSpec(codecSpec, registry);

    // Runtime data validation
    const dataResults = validateRuntimeData(codecSpec, value, registry);

    // Process all validation results
    const allResults = [...staticResults, ...dataResults];
    processValidationResults(allResults, throwOnFatal, onValidation);
  }

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
