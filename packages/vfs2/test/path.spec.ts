import { join } from 'path';
import { expect } from 'chai';
import { createNormalizeVfs, NormalizeFs } from '..';
import { path } from '..';
import normalizePath from 'normalize-path';
describe('标准path', () => {
  // beforeEach(() => {});
  // afterEach(async () => {});
  it('join', async () => {
    let cwd = process.cwd();
    let fp = path.join(cwd, 'abc');

    expect(fp).eq(normalizePath(join(cwd, 'abc')));
  });
  it('isRelative', () => {
    expect(path.isRelative(process.cwd())).eq(false);
    expect(path.isRelative('abc')).eq(true);
    expect(path.isRelative('foo/bar')).eq(true);
  });
  it('basename', () => {
    expect(path.basename('foo/bar.txt')).eq('bar.txt');
    expect(path.basename('foo/bar.txt', '.txt')).eq('bar');
  });
  it('resolve', () => {
    expect(path.resolve(process.cwd(), 'abc')).eq(path.join(process.cwd(), 'abc'));
    expect(path.resolve(process.cwd(), './abc')).eq(path.join(process.cwd(), 'abc'));
    expect(path.resolve(process.cwd(), 'D:\\test')).eq('D:/test');
  });
  it('relative', () => {
    expect(path.relative(process.cwd(), path.join(process.cwd(), 'abc'))).eq('abc');
  });
 
});
