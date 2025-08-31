import { installAll } from './install';
import { CodecRegistry } from './registry';

let _default: CodecRegistry | null = null;

export function getDefaultRegistry(): CodecRegistry {
  if (!_default) {
    _default = new CodecRegistry();
    installAll(_default);
  }

  return _default;
}
