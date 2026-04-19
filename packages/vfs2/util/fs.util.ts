import type { FSLayerType, FSType } from '../type';
import { dirname } from 'path';
import type { SetRequired, SetNonNullable } from 'type-fest';
import fg, { FileSystemAdapter } from 'fast-glob';
import { PathVfsLayerOptions } from '../layer/path.layer';
import { resolvePath } from './resolve-path';
import { PathLike } from 'fs';
import { nPath as path } from '../path';
export class FsUtil {
  delete;
  read;
  #fsLayer;
  #options;
  constructor(fsLayer: FSLayerType, options?: PathVfsLayerOptions) {
    this.#fsLayer = fsLayer;
    this.#options = options;
    this.delete = fsLayer.rm!.bind(fsLayer);
    this.read = fsLayer.readFile!.bind(fsLayer);
  }

  writeFile = async (...args: Parameters<FSType['writeFile']>) => {
    let dir = dirname(args[0] as any);
    await this.#fsLayer.mkdir!(dir, { recursive: true });
    return this.#fsLayer.writeFile!(...args);
  };
  write = this.writeFile;

  /** 读取文件内容(字符串) */
  readFileContent = (
    path: string,
    options: SetNonNullable<SetRequired<Extract<Parameters<FSType['readFile']>[1], Record<string, any>>, 'encoding'>, 'encoding'> = {
      encoding: 'utf-8',
    }
  ) => {
    return this.#fsLayer.readFile!(path, options).catch(() => undefined);
  };
  rename = async (oldPath: PathLike, newPath: string) => {
    let targetDir = path.dirname(newPath);
    if (!(await this.exists(targetDir))) {
      await this.#fsLayer.mkdir!(targetDir, { recursive: true });
    }
    return this.#fsLayer.rename!(oldPath, newPath);
  };
  readContent = this.readFileContent;
  exists = async (path: string) => {
    return this.#fsLayer.access!(path)
      .then(() => true)
      .catch(() => false);
  };
  isDirectory = async (...args: Parameters<FSType['stat']>) => {
    return this.#fsLayer.stat!(...args)
      .then((stat) => {
        return stat.isDirectory();
      })
      .catch(() => false);
  };
  list = async (path: string, options?: Parameters<FSType['readdir']>[1]) => {
    return this.#fsLayer.readdir!(path, options as any).catch(() => [] as string[]);
  };

  glob = (
    pattern: Parameters<FSType['glob']>[0],
    options?: {
      cwd: string;
      exclude?: string[];
      withFileTypes?: Parameters<FSType['glob']>[1]['withFileTypes'];
    }
  ) => {
    return this.#fsLayer.glob!(pattern, { ...options, cwd: options?.cwd ? resolvePath(options.cwd, this.#options?.dir) : undefined });
  };
  move = async (...args: [string | URL, string]) => {
    try {
      return await this.rename!(...args);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code == 'EXDEV') {
        const src = args[0] as string;
        const dst = args[1];
        try {
          await this.#fsLayer.cp!(src, dst, { recursive: true });
          await this.#fsLayer.rm!(src, { recursive: true });
        } catch (rmError) {
          // Rollback: delete copied file if source removal fails
          await this.#fsLayer.rm!(dst, { recursive: true }).catch(() => {});
          throw rmError;
        }
      } else {
        throw error;
      }
    }
  };
}
