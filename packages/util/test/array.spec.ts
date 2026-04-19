import { expect } from 'chai';

import { fromAsync } from '../Array.fromAsync';
describe('Array', () => {
  it('fromAsync', async () => {
    async function* stringGenerator() {
      yield 'hello';
      yield 'world';
      yield 'async';
      yield 'iterator';
    }
    const result = stringGenerator();
    const list = await fromAsync(result);
    expect(list).deep.eq(['hello', 'world', 'async', 'iterator']);
  });
});
