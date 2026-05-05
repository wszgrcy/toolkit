import { expect } from 'chai';
import { v4 } from 'uuid';
import { path } from '@cyia/vfs2';
import { TestDir } from './util/const';
import * as fs from 'fs';
import { MindFile } from '../mind-file';
describe('flow-file', () => {
  beforeEach(async () => {
    await fs.promises.rm(TestDir, { force: true, recursive: true });
    await fs.promises.mkdir(TestDir, { recursive: true });
  });
  it('写图片', async () => {
    const filePath = path.join(TestDir, v4());
    const file = new MindFile(filePath);
    await file.save({ a: 1 });
    const extractDir = path.join(TestDir, 'ext');
    await fs.promises.mkdir(extractDir);
    file.setTemp(extractDir);
    await file.writeTempImage('tmp1', new Uint8Array([1, 2]));
    let buffer = await file.readImageBuffer('tmp1');
    expect(buffer?.length).eq(2);
    await file.save({
      id: 1,
      flow: { nodes: [{ type: 'image', data: { value: { src: 'tmp1' } } }] },
      storeList: [],
    });
    await file.clearBackup();
    buffer = await file.readImageBuffer('tmp1');
    expect(buffer?.length).eq(2);
  });
});
