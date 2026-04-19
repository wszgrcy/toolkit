import { inject, RootStaticInjectOptions } from 'static-injector';

import { execa } from 'execa';
import fs from 'fs';
import fsPromise from 'fs/promises';

import * as tar from 'tar';
import path, { dirname } from 'path';
import { ZipConfigToken } from './token';
import { createZstdCompress, constants } from 'zlib';
import { ZipFile } from 'yazl';
import { promise as fastq } from 'fastq';
import { pipeline } from 'stream/promises';
export class ZipService extends RootStaticInjectOptions {
  #zipConfig = inject(ZipConfigToken, { optional: true });

  async _7zip(
    inputList: string[],
    output: string,
    options?: {
      cwd?: string;
      removeInput?: boolean;
      password?: string;
    },
  ) {
    if (!this.#zipConfig?._7zipExePath) {
      throw new Error('7zip可执行文件路径不存在');
    }
    const exePath = this.#zipConfig?._7zipExePath!;
    const addList = [];
    if (options?.password) {
      addList.push(`-p${options.password}`);
    }
    // ./7zr.exe a -mx9 xxx.7z ./水浒传-7336223637033983-2024-10-31-11-19-38.snapshot ./水浒传-7336223637033983-2024-10-31-11-19-38.snapshot.checksum
    const result = await execa({ cwd: options?.cwd })(exePath, [
      `a`,
      ...addList,
      `${output}`,
      ...inputList,
    ]);

    if (options?.removeInput) {
      for (const input of inputList) {
        await fs.promises.rm(input, { force: true, recursive: true });
      }
    }
  }

  async tgz(
    input: string,
    output: string,
    options?: {
      removeInput?: boolean;
      compress?: boolean;
      compressionLevel?: number;
    },
  ) {
    const dir = dirname(output);
    await fsPromise.mkdir(dir, { recursive: true });
    const readStream = tar.c(
      {
        z: options?.compressionLevel
          ? { level: options.compressionLevel }
          : (options?.compress ?? true),
        C: input,
      },
      ['.'],
    );
    const writeStream = fs.createWriteStream(output);
    await pipeline(readStream, writeStream);
    if (options?.removeInput) {
      await fs.promises.rm(input, { force: true, recursive: true });
    }
  }
  async tarZstd(
    input: string,
    output: string,
    options?: {
      cwd?: string;
      removeInput?: boolean;
      password?: string;
      level?: number;
    },
  ) {
    const dir = dirname(output);
    await fsPromise.mkdir(dir, { recursive: true });
    const tarStream = tar.c({ z: false, C: input }, ['.']);
    const zstdStream = createZstdCompress({
      params: {
        [constants.ZSTD_c_compressionLevel]: options?.level ?? 1,
        // [constants.ZSTD_c_nbWorkers]: cpus().length,
      },
    });
    const writeStream = fs.createWriteStream(output);
    await pipeline(tarStream, zstdStream, writeStream);
    if (options?.removeInput) {
      await fs.promises.rm(input, { force: true, recursive: true });
    }
  }

  async zip(
    input: string,
    output: string,
    options?: {
      compress?: boolean;
      compressionLevel?: number;
    },
  ) {
    const dir = dirname(output);
    await fsPromise.mkdir(dir, { recursive: true });
    const zipfile = new ZipFile();
    const list = fs.promises.glob('**/*', { cwd: input });
    const queue = fastq(async (fileName: string) => {
      const filePath = path.join(input, fileName);
      const stat = await fs.promises.stat(filePath);
      if (stat.isFile()) {
        return zipfile.addReadStream(
          fs.createReadStream(filePath),
          fileName,
          options,
        );
      }
    }, 1000);
    const writeStream = fs.createWriteStream(output);
    const pipelinePromise = pipeline(zipfile.outputStream, writeStream);
    for await (const key of list) {
      queue.push(key);
    }
    await queue.drained();
    zipfile.end();
    return pipelinePromise;
  }
}
