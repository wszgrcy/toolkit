import { expect } from 'chai';
import { createAsyncGeneratorAdapter, isEmptyInput, isTruthy } from '../index';
import { isNonNullable } from '../is-non-nullable';
import { pickBy } from 'es-toolkit';
describe('util', () => {
  it('isTruthy', () => {
    const list = [1, 0].filter(isTruthy);
    expect(list).deep.eq([1]);
  });
  it('isTruthy-pickBy', () => {
    const result = pickBy({ a: undefined, b: null, c: 1 }, isTruthy);
    expect(result).deep.eq({ c: 1 });
  });
  it('isNonNullable', () => {
    const list = [1, undefined, 0, null].filter(isNonNullable);
    expect(list).deep.eq([1, 0]);
  });
  it('isNonNullable-pickBy', () => {
    const result = pickBy({ a: undefined, b: null, c: 1 }, isNonNullable);
    expect(result).deep.eq({ c: 1 });
  });
  it('asg', async () => {
    const aga = createAsyncGeneratorAdapter<number>();
    aga.next(1);
    aga.complete();
    const list = [];
    const data = aga.getData();
    for await (const item of data) {
      list.push(item);
    }
    expect(list).deep.eq([1]);
  });
  it('asg wait', async () => {
    const aga = createAsyncGeneratorAdapter<number>();
    aga.next(1);
    const list = [];
    const data = aga.getData();
    for await (const item of data) {
      list.push(item);
      break;
    }
    expect(list).deep.eq([1]);
  });
  it('empty input', () => {
    expect(isEmptyInput(undefined)).true;
    expect(isEmptyInput('')).true;
    expect(isEmptyInput(0)).false;
    expect(isEmptyInput(false)).false;
  });
});
