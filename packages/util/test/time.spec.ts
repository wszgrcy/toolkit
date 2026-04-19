import { expect } from 'chai';
import { formatTime } from '../format-time';
describe('time', () => {
  it('format-time', () => {
    const a = new Date();
    const b = formatTime(a);
    expect(typeof b === 'string').true;
  });
});
