import { expect } from 'chai';
import { isAsyncIterable, isIterable, isStringArray } from '../index';
describe('is', () => {
  it('isIterable', () => {
    function* xxx() {}
    expect(isIterable(xxx())).true;
    expect(isIterable([])).true;
  });
  it('isAsyncIterable', () => {
    async function* xxx() {}
    expect(isAsyncIterable(xxx())).true;
  });
  it('isStringArray', () => {
    expect(isStringArray([])).true;
    expect(isStringArray(['1'])).true;
    expect(isStringArray(['1', 0])).false;
  });
});
