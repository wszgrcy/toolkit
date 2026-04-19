import { join } from 'path';
import { expect } from 'chai';
import { createNormalizeVfs, NormalizeFs, path } from '..';

describe('标准vfs', () => {
  let host: NormalizeFs;
  let root = join(process.cwd(), './packages/vfs2/test/fixture');
  let writeDir = join(process.cwd(), './packages/vfs2/test/fixture/writeDir');

  beforeEach(() => {
    host = createNormalizeVfs({ dir: root });
  });
  afterEach(async () => {
    try {
      await host.rm(writeDir, { recursive: true });
    } catch (error) {}
  });
  it('writeFile', async () => {
    host = createNormalizeVfs({ dir: writeDir });
    let dir = './abc';
    await host.writeFile('./abc', 'abcd');
    let exists = await host.exists(dir);
    expect(exists).eq(true);
    let content = await host.readContent(dir);
    expect(content).eq('abcd');
  });

  it('readFileContent', async () => {
    let content = await host.readFileContent(`template2/world.ts.t2.template`);
    expect(content).eq('let a=1');
  });
  it('readFileContent-根', async () => {
    let vfs = createNormalizeVfs({});
    let content = await vfs.readFileContent(path.join(root, `template2/world.ts.t2.template`));
    expect(content).eq('let a=1');
  });
  it('readFileContent-根-相对', async () => {
    let vfs = createNormalizeVfs({});
    try {
      await vfs.readFileContent(`template2/world.ts.t2.template`);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).contain('[template2/world.ts.t2.template]');
        return;
      }
    }
    throw new Error('相对验证失败');
  });
  it('readFileContent(不存在)', async () => {
    let content = await host.readFileContent(`./foo/bar.ts`);
    expect(content).eq(undefined);
  });
  it('isDirectory', async () => {
    let result = await host.isDirectory(`template2`);
    expect(result).eq(true);
    result = await host.isDirectory(`template2xx`);
    expect(result).eq(false);
  });
  it('exists', async () => {
    let result = await host.exists(`template2`);
    expect(result).eq(true);
    result = await host.exists(`template2xx`);
    expect(result).eq(false);
  });
  it('list', async () => {
    let list = await host.list(`workspace-same`);
    expect(list.includes('file1')).true
  });
  it('glob', async () => {
    let list = host.glob(`**/*`, { cwd: 'workspace-same' });
    let i = 0;
    let matchList = ['dir1', 'file1', 'dir1/file2'];
    for await (const item of list) {
      expect(matchList[i].includes(path.normalize(item))).true;
      i++;
    }
    expect(matchList.length).eq(i);
  });
  it('rename', async () => {
    let filePath = './rename/a/b/c.ts';
    await host.rename(`template2/world.ts.t2.template`, filePath);
    expect(await host.exists(filePath)).eq(true);
    await host.rename(filePath, `template2/world.ts.t2.template`);
  });
  it('move跨盘', async () => {
    let input = path.join(root, 'tes.test');
    await host.writeFile(input, '123456');
    let exist = await host.exists(input);
    expect(exist).eq(true);
    let output = path.join('D:/', 'a/b', 'c.test');
    await host.move(input, output);
    exist = await host.exists(output);
    expect(exist).eq(true);
    exist = await host.exists(input);
    expect(exist).eq(false);
    await host.delete(output);
  });
  it('move跨盘文件夹', async () => {
    let input = path.join(root, 'a/tes.test');
    await host.writeFile(input, '123456');
    let exist = await host.exists(input);
    expect(exist).eq(true);
    let output = path.join('D:/', 'a/b', 'c.test');
    await host.move(path.join(root, 'a'), output);
    exist = await host.exists(output);
    expect(exist).eq(true);
    exist = await host.exists(input);
    expect(exist).eq(false);
    await host.delete(output, { recursive: true });
  });
  it('move同盘', async () => {
    let input = path.join(root, 'tes.test');
    await host.writeFile(input, '123456');
    let exist = await host.exists(input);
    expect(exist).eq(true);
    let output = path.join(root, 'a/b', 'c.test');
    await host.move(input, output);
    exist = await host.exists(output);
    expect(exist).eq(true);
    exist = await host.exists(input);
    expect(exist).eq(false);
    await host.delete(output);
  });
  it('当前文件夹判断', async () => {
    host = createNormalizeVfs({ dir: join(process.cwd(), './packages/vfs2/test/fixture') });
    let result = await host.exists('');
    expect(result).eq(true);
    host = createNormalizeVfs({ dir: join(process.cwd(), './packages/vfs2/test/xxxyyyzzz') });
    result = await host.exists('');
    expect(result).eq(false);
  });
  it('读取当前文件夹', async () => {
    host = createNormalizeVfs({ dir: join(process.cwd(), './packages/vfs2/test/fixture') });
    let result = await host.readdir('');
    expect(result.length).greaterThan(0);
  });
});
