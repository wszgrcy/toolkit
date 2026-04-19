import { inject, RootStaticInjectOptions } from 'static-injector';

import { execa } from 'execa';
import extract from 'extract-zip';
import { path } from '@cyia/vfs2';
import * as tar from 'tar';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { ZipConfigToken } from './token';
import { createZstdDecompress } from 'zlib';

export class UnzipService extends RootStaticInjectOptions {
  #zipConfig = inject(ZipConfigToken, { optional: true });
  /** zip 解压缩 */
  async unzip(input: string, output: string) {
    await extract(input, { dir: output });
  }
  /** tar.gz/tgz解压缩 */
  async tgz(
    input: string,
    output: string,
    options?: {
      strip?: number;
    },
  ) {
    await fs.mkdir(output, { recursive: true });
    return tar.x({ C: output, file: input, strip: options?.strip });
  }
  async #_7zip(
    input: string,
    output: string,
    options?: {
      cwd?: string;
      flat?: boolean;
      removeZip?: boolean;
      password?: string;
    },
  ) {
    if (!this.#zipConfig?._7zipExePath) {
      throw new Error('7zip可执行文件路径不存在');
    }
    const exePath = path.normalize(this.#zipConfig?._7zipExePath!);
    const addList = [];
    if (options?.password) {
      addList.push(`-p${options.password}`);
    }
    // ./7zr.exe x -o./xyx -aoa ./windows-bin.7z
    const result = await execa({ cwd: options?.cwd })(exePath, [
      `x`,
      `-o${output}`,
      `-aoa`,
      ...addList,
      `${input}`,
    ]);
    if (options?.flat) {
      const absOutput = options.cwd ? path.join(options.cwd, output) : output;
      const list = await fs.readdir(absOutput);
      if (list.length === 1) {
        const oldDir = path.join(absOutput, list[0]);
        await fs.cp(oldDir, absOutput, {
          force: true,
          recursive: true,
        });
        await fs.rm(oldDir, { force: true, recursive: true });
      } else {
        throw new Error('超过一个子文件夹无法拍平');
      }
    }
    if (options?.removeZip) {
      const absInput = options.cwd ? path.join(options.cwd, input) : input;
      await fs.rm(absInput, { force: true });
    }
  }
  /** tar.zstd 解压缩 */
  async tarZstd(
    input: string,
    output: string,
    options?: {
      strip?: number;
    },
  ) {
    await fs.mkdir(output, { recursive: true });
    const readStream = createReadStream(input);
    const zstdStream = createZstdDecompress();
    const tarStream = tar.x({ C: output, strip: options?.strip });
    await pipeline(readStream, zstdStream, tarStream);
  }
  async autoUnzip(
    input: string,
    output: string,
    options: { removeZip?: boolean; strip?: number; clean?: boolean } = {
      clean: true,
      removeZip: true,
    },
  ) {
    const result = await fileTypeFromFile(path.normalize(input));
    let canRemoveZip = true;
    if (options.clean) {
      await fs.rm(output, { force: true, recursive: true });
    }
    await fs.mkdir(output, { recursive: true });
    if (result?.mime === 'application/x-7z-compressed') {
      await this.#_7zip(input, output);
    } else if (result?.mime === 'application/gzip') {
      await this.tgz(input, output, { strip: options?.strip });
    } else if (result?.mime === 'application/zip') {
      await this.unzip(input, output);
    } else if (result?.mime === 'application/zstd') {
      await this.tarZstd(input, output, { strip: options?.strip });
    } else {
      canRemoveZip = false;
    }
    if (canRemoveZip && options?.removeZip) {
      await fs.rm(input, { recursive: true, force: true });
    }
    return canRemoveZip;
  }
}
