import { expect } from 'chai';
import { documentName, RawFile } from '../raw-file';
import { v4 } from 'uuid';
import { path } from '@cyia/vfs2';
import { TestDir } from './util/const';
import * as fs from 'fs';
describe('bundle-file', () => {
  beforeEach(async () => {
    await fs.promises.rm(TestDir, { force: true, recursive: true });
    await fs.promises.mkdir(TestDir, { recursive: true });
  });
  it('hello', async () => {
    const filePath = path.join(TestDir, v4());
    let file = new RawFile(filePath);
    await file.save({ a: 1 });
    const stat = await fs.promises.stat(filePath);
    expect(stat.isFile()).true;
    await file.close();
    file = new RawFile(filePath);
    const data = await file.readData();
    expect(data).deep.eq({ a: 1 });
  });
  it('读原始', async () => {
    const filePath = path.join(TestDir, v4());
    const file = new RawFile(filePath);
    await file.save({ a: 1 });
    const stat = await fs.promises.stat(filePath);
    expect(stat.isFile()).true;
    let data = await file.readOriginData();
    expect(data).deep.eq({ a: 1 });
    data = await file.readData();
    expect(data).deep.eq({ a: 1 });
  });
  it('读备份', async () => {
    const filePath = path.join(TestDir, v4());
    const file = new RawFile(filePath);
    const extractDir = path.join(TestDir, 'ext');
    await fs.promises.mkdir(extractDir);
    await fs.promises.writeFile(
      path.join(extractDir, documentName),
      JSON.stringify({ a: 2 }),
    );
    file.setTemp(extractDir);
    expect(file.getBackupDir()).eq(extractDir);
    const data = await file.readData();
    expect(data).deep.eq({ a: 2 });
  });
  it('优先备份', async () => {
    const filePath = path.join(TestDir, v4());
    const file = new RawFile(filePath);
    await file.save({ a: 1 });
    const extractDir = path.join(TestDir, 'ext');
    await fs.promises.mkdir(extractDir);
    await fs.promises.writeFile(
      path.join(extractDir, documentName),
      JSON.stringify({ a: 2 }),
    );
    file.setTemp(extractDir);
    const data = await file.readData();
    expect(data).deep.eq({ a: 2 });
  });
  it('写备份', async () => {
    const filePath = path.join(TestDir, v4());
    const file = new RawFile(filePath);
    const extractDir = path.join(TestDir, 'ext');
    await fs.promises.mkdir(extractDir);
    file.setTemp(extractDir);
    await file.writeBackupDocument({ a: 2 });
    const data = await file.readData();
    expect(data).deep.eq({ a: 2 });
  });
  it('备份清理', async () => {
    const filePath = path.join(TestDir, v4());
    const file = new RawFile(filePath);
    await file.save({ a: 1 });
    const extractDir = path.join(TestDir, 'ext');
    await fs.promises.mkdir(extractDir);
    file.setTemp(extractDir);
    await file.writeBackupDocument({ a: 2 });
    let data = await file.readData();
    expect(data).deep.eq({ a: 2 });
    await file.clearBackup();
    data = await file.readData();
    expect(data).deep.eq({ a: 1 });
  });
  it('强制读取', async () => {
    const filePath = path.join(TestDir, v4());
    const file = new RawFile(filePath);
    await file.save({ a: 1 });
    const extractDir = path.join(TestDir, 'ext');
    await fs.promises.mkdir(extractDir);
    file.setTemp(extractDir);
    await file.writeBackupDocument({ a: 2 });
    let data = await file.readData();
    expect(data).deep.eq({ a: 2 });
    await file.clearBackup();
    data = await file.readData();
    expect(data).deep.eq({ a: 1 });
  });
});
