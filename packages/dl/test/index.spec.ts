import { expect } from 'chai';
import {
  DefaultOptions,
  downloadFile,
  downloadFileStop,
  ProgressItem,
} from '../download';
import path from 'path';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { startServer, stopServer } from './test-server';

const BASE_URL = 'http://localhost:18932';

let serverStarted = false;

describe('download', () => {
  before(async () => {
    if (!serverStarted) {
      await startServer();
      serverStarted = true;
    }
  });

  after(async () => {
    if (serverStarted) {
      await stopServer();
    }
  });

  beforeEach(async () => {
    await rm(path.join(process.cwd(), '.tmp'), {
      recursive: true,
      force: true,
    });
  });

  it('hello', async () => {
    const output = path.join(process.cwd(), '.tmp/download/a.txt');
    const { end$$ } = await downloadFileStop(`${BASE_URL}/`, {
      ...DefaultOptions,
      savePath: output,
    });
    expect(await end$$).eq(0);
    expect(existsSync(output)).eq(true);
  });

  it('signal直接停止', async () => {
    const output = path.join(process.cwd(), '.tmp/download/b');
    const ab = new AbortController();
    ab.abort();
    const { end$$ } = await downloadFileStop(`${BASE_URL}/`, {
      ...DefaultOptions,
      signal: ab.signal,
      savePath: output,
    });
    expect(await end$$).eq(1);
  });

  it('事件', async () => {
    const output = path.join(process.cwd(), '.tmp/download/b');
    let statusCount = 0;
    let messageCount = 0;
    const end = await downloadFile(`${BASE_URL}/b`, {
      savePath: output,
      progressSampleTime: 0,
      message(item) {
        if (item.type === 'status') {
          if (item.data === 0) {
            expect(item.data).eq(0);
            statusCount = 1;
          }
        } else if (item.type === 'loading') {
          expect((item.data as ProgressItem).speed).greaterThan(0);
          messageCount = 1;
          expect(item.data.fileName).eq('b');
        }
      },
    });
    expect(statusCount).eq(1);
    expect(messageCount).eq(1);
    expect(end).ok;
    expect(end?.getFilePath?.()).eq(output);
  });

  it('dir输出文件名', async () => {
    const output = path.join(process.cwd(), '.tmp/download');

    const end = await downloadFile(`${BASE_URL}/assets/img/logo.svg`, {
      directory: output,
      progressSampleTime: 0,
    });

    expect(end).ok;
    expect(end?.getFilePath?.()).eq(path.join(output, 'logo.svg'));
  });

  it('signal等待停止', async () => {
    const output = path.join(process.cwd(), '.tmp/download/c');
    const ab = new AbortController();
    const { end$$ } = await downloadFileStop(`${BASE_URL}/c`, {
      savePath: output,
      signal: ab.signal,
      chunkSize: 1024,
      connectionCount: 1,
      heartbeatStopTimeout: 30_000,
      lowStopTimeout: 30_000,
    });
    setTimeout(() => {
      ab.abort();
    }, 500);
    const end = await end$$;
    expect(end).eq(1);
  });

  it('多包', async () => {
    const output = path.join(process.cwd(), '.tmp/download/ggml-vulkan.zip');

    const end = await downloadFile(
      [
        `${BASE_URL}/ggml-vulkan.zip.001`,
        `${BASE_URL}/ggml-vulkan.zip.002`,
        `${BASE_URL}/ggml-vulkan.zip.003`,
      ],
      {
        savePath: output,
        progressSampleTime: 0,
      },
    );

    expect(end).ok;
    expect(end?.getFilePath?.()).eq(output);
  });
});
