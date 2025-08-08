import { describe, expect, it } from 'vitest';
import { registry } from '../src/registry';

describe('registry', () => {
  it('should return', () => {
    const list = registry.listTypes();
    console.log(list);
    const arr = registry.get('array');
    console.log(arr);
  });
});
