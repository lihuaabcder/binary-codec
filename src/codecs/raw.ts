import type { Codec, MetaField } from '../types.ts';
import { ValidationLevel } from '../validation/types.ts';

export type RawField = MetaField<'raw'>;

export const rawCodec: Codec<RawField, Uint8Array> = {
  type: 'raw',
  read: (view, spec) => {
    const { byteOffset, byteLength } = spec;
    return new Uint8Array(view.buffer, view.byteOffset + byteOffset, byteLength);
  },
  write: (view, spec, value) => {
    const { byteOffset } = spec;
    new Uint8Array(view.buffer, view.byteOffset + byteOffset, value.length).set(value);
  },
  validate: (spec, path, _ctx) => {
    const results = [];
    const { byteLength } = spec;

    if (byteLength <= 0) {
      results.push({
        level: ValidationLevel.FATAL,
        message: 'Raw field byteLength must be positive',
        path: `${path}.byteLength`,
        code: 'INVALID_RAW_LENGTH'
      });
    }

    return results;
  },
  validateData: (spec, data, path, _ctx) => {
    const results = [];

    if (!(data instanceof Uint8Array)) {
      results.push({
        level: ValidationLevel.FATAL,
        message: `Expected Uint8Array for raw field, got ${typeof data}`,
        path,
        code: 'INVALID_RAW_DATA_TYPE'
      });
      return results;
    }

    const { byteLength } = spec;

    if (data.length !== byteLength) {
      results.push({
        level: ValidationLevel.ERROR,
        message: `Raw data length mismatch: expected ${byteLength}, got ${data.length}`,
        path,
        code: 'RAW_DATA_LENGTH_MISMATCH'
      });
    }

    return results;
  }
};
