import { expect } from 'chai';
import { deepClone } from '../clone';
describe('is', () => {
  it('clone', () => {
    const a = { v: 1 };
    const b = deepClone(a);
    expect(a).deep.eq(b);
  });
});
