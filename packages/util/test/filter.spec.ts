import { expect } from 'chai';

import {
  deepFilterObjectEmptyKey,
  filterListEmptyKey,
  filterObjectEmptyKey,
} from '../filter';
describe('filter', () => {
  it('filter-obj', () => {
    const obj1 = { a: 0, b: undefined, c: null, d: '' };
    expect(filterObjectEmptyKey(obj1)).deep.eq({ a: 0, d: '' });
  });
  it('deep-filter-obj', () => {
    const obj1 = {
      a: 0,
      b: undefined,
      o1: {
        a: 0,
        b: undefined,
      },
      a1: [1, undefined],
    };
    expect(deepFilterObjectEmptyKey(obj1)).deep.eq({
      a: 0,
      o1: { a: 0 },
      a1: [1, undefined],
    });
  });
  it('deep-filter-obj child array remove', () => {
    const obj1 = {
      a: 0,
      b: undefined,
      o1: {
        a: 0,
        b: undefined,
      },
      a1: [1, undefined],
    };
    expect(
      deepFilterObjectEmptyKey(obj1, { removeUndefinedArrayItem: true }),
    ).deep.eq({ a: 0, o1: { a: 0 }, a1: [1] });
  });
  it('deep-filter-obj nest array', () => {
    const obj1 = {
      a: 0,
      b: undefined,
      o1: {
        a: 0,
        b: undefined,
      },
      a1: [{ v1: undefined, v2: 0, l1: [{ v1: undefined, v2: 0 }] }, undefined],
    };
    expect(deepFilterObjectEmptyKey(obj1)).deep.eq({
      a: 0,
      o1: {
        a: 0,
      },
      a1: [{ v2: 0, l1: [{ v2: 0 }] }, undefined],
    });
  });
  it('deep-filter-obj nest array2', () => {
    const obj1 = {
      a: 0,
      b: undefined,
      o1: {
        a: 0,
        b: undefined,
      },
      a1: [[{ v1: undefined, v2: 0 }]],
    };
    expect(deepFilterObjectEmptyKey(obj1)).deep.eq({
      a: 0,
      o1: {
        a: 0,
      },
      a1: [[{ v2: 0 }]],
    });
  });
  it('filter-array', () => {
    const list = [0, undefined, null, ''];
    expect(filterListEmptyKey(list)).deep.eq([0, '']);
  });
});
