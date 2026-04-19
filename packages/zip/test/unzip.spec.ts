import { createRootInjector } from 'static-injector';
import { expect } from 'chai';
import { UnzipService } from '../unzip.service';
import path from 'path';
import { v4 } from 'uuid';
import fs from 'fs';
import { platform } from 'os';
import { ZipConfigToken } from '../token';

async function copyFixtureToTemp(fixtureFileName: string): Promise<string> {
  const fixtureDir = path.join(process.cwd(), './packages/zip/test/fixture');
  const tempFilePath = path.join(process.cwd(), '.tmp', v4(), fixtureFileName);
  await fs.promises.cp(path.join(fixtureDir, fixtureFileName), tempFilePath, {
    force: true,
    recursive: true,
  });
  return tempFilePath;
}

describe('解压缩', () => {
  const tmpDir = path.join(process.cwd(), '.tmp');
  const instance = createRootInjector({
    providers: [
      UnzipService,
      {
        provide: ZipConfigToken,
        useValue: {
          _7zipExePath: path.join(process.cwd(), './.bin/7zr.exe'),
        },
      },
    ],
  });

  const unzip = instance.get(UnzipService);
  it('zip', async () => {
    const input = await copyFixtureToTemp('zip.zip');
    const output = path.join(tmpDir, v4());
    await unzip.autoUnzip(input, output);
    const result = fs.existsSync(output);
    expect(result).eq(true);
    expect(fs.existsSync(path.join(output, 'zip.txt'))).eq(true);
    const content = await fs.promises.readFile(path.join(output, 'zip.txt'), {
      encoding: 'utf-8',
    });
    expect(content).eq('zip');
  });
  if (platform() === 'win32') {
    it.skip('7zip', async () => {
      const input = await copyFixtureToTemp('7zip.7z');
      const output = path.join(tmpDir, v4());
      await unzip.autoUnzip(input, output);
      const result = fs.existsSync(output);
      expect(result).eq(true);
      expect(fs.existsSync(path.join(output, '7zip.txt'))).eq(true);
      const content = await fs.promises.readFile(
        path.join(output, '7zip.txt'),
        { encoding: 'utf-8' },
      );
      expect(content).eq('7zip');
    });
  }
  it('tar.gz', async () => {
    const input = await copyFixtureToTemp('tgz.tar.gz');
    const output = path.join(tmpDir, v4());
    await unzip.autoUnzip(input, output);
    const result = fs.existsSync(output);
    expect(result).eq(true);
    expect(fs.existsSync(path.join(output, 'tar.gz.txt'))).eq(true);
    const content = await fs.promises.readFile(
      path.join(output, 'tar.gz.txt'),
      { encoding: 'utf-8' },
    );
    expect(content).eq('tar.gz');
  });

  it('tar.zstd', async () => {
    const input = await copyFixtureToTemp('zstd.tar.zstd');
    const output = path.join(tmpDir, v4());
    await unzip.autoUnzip(input, output);
    const result = fs.existsSync(output);
    expect(result).eq(true);
    const content = await fs.promises.readFile(
      path.join(output, 'tarzstd.txt'),
      { encoding: 'utf-8' },
    );
    expect(content).eq('tarzstd');
  });
  it.skip('tar.zstd', async () => {
    const input = await copyFixtureToTemp('env.zstd');
    const output = path.join(tmpDir, v4());

    await unzip.autoUnzip(input, output);
    const result = fs.existsSync(output);
    expect(result).eq(true);
  });
});
