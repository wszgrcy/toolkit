import { path } from '@cyia/vfs2';
import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { ZipService } from '../zip.service';
import { ZipConfigToken } from '../token';
import { UnzipService } from '../unzip.service';
import { v4 } from 'uuid';
import fs from 'fs';
describe('压缩', () => {
  const fixtureDir = path.join(process.cwd(), './packages/zip/test/fixture');
  const tmpDir = path.join(process.cwd(), '.tmp');
  const instance = createRootInjector({
    providers: [
      ZipService,
      {
        provide: ZipConfigToken,
        useValue: {
          _7zipExePath: path.join(process.cwd(), './.bin/7zr.exe'),
        },
      },
    ],
  });
  const zip = instance.get(ZipService);
  const unzip = instance.get(UnzipService);
  it('tgz', async () => {
    const output = path.join(tmpDir, v4(), 'output.tar.gz');
    await zip.tgz(path.join(fixtureDir, './zip'), output);

    expect(fs.existsSync(output)).eq(true);
    const output2 = path.join(tmpDir, v4());
    await unzip.tgz(output, output2);

    const result = fs.existsSync(output2);
    expect(result).eq(true);
    expect(fs.existsSync(path.join(output2, 'zip.txt'))).eq(true);
    const content = await fs.promises.readFile(path.join(output2, 'zip.txt'), {
      encoding: 'utf-8',
    });
    expect(content).eq('zip');
  });
  it('tarzstd', async () => {
    const output = path.join(tmpDir, v4(), 'output.tar.zstd');
    await zip.tarZstd(path.join(fixtureDir, './zstd'), output);

    expect(fs.existsSync(output)).eq(true);
    const output2 = path.join(tmpDir, v4());
    await unzip.tarZstd(output, output2);
    const result = fs.existsSync(output2);
    expect(result).eq(true);
    expect(fs.existsSync(path.join(output2, 'tarzstd.txt'))).eq(true);
    const content = await fs.promises.readFile(
      path.join(output2, 'tarzstd.txt'),
      { encoding: 'utf-8' },
    );
    expect(content).eq('tarzstd');
  });
  it('zip', async () => {
    const output = path.join(tmpDir, v4(), 'output.zip');
    await zip.zip(path.join(fixtureDir, './zip'), output);
    expect(fs.existsSync(output)).eq(true);
    const output2 = path.join(tmpDir, v4());
    await unzip.unzip(output, output2);
    const result = fs.existsSync(output2);
    expect(result).eq(true);
    expect(fs.existsSync(path.join(output2, 'zip.txt'))).eq(true);
    const content = await fs.promises.readFile(path.join(output2, 'zip.txt'), {
      encoding: 'utf-8',
    });
    expect(content).eq('zip');
  });
});
