import { installAll } from './install.ts';
import { CodecRegistry } from './registry.ts';

let _default: CodecRegistry | null = null;

export function getDefaultRegistry(): CodecRegistry {
  if (!_default) {
    _default = new CodecRegistry();
    installAll(_default);
  }

  return _default;
}
