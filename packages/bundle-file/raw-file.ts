import * as fs from 'fs/promises';

import { path } from '@cyia/vfs2';
import { computed, signal } from 'static-injector';
import { createWriteStream } from 'fs';
import * as fs2 from 'fs';
import { promisify } from 'util';
import type { Entry } from 'yauzl';
import { ZipFile } from 'yazl';
// 本文件应该同时为mind和workflow服务
const openPromisify = promisify(fs2.open);
const fstatPromisify = promisify(fs2.fstat);
const fileClosePromisify = promisify(fs2.close);

export const documentName = 'document';
export const imgDirName = 'images';
export const imgDirNameSlash = 'images/';
const EmptyPromise = Promise.resolve(undefined);
export class TempDirFlowFile {
  #path;
  imageList$$ = computed(() => path.join(this.dir, imgDirName));
  constructor(public dir: string) {
    this.#path = path.join(dir, documentName);
  }
  async hasBackup() {
    return await fs
      .stat(this.#path)
      .then(() => true)
      .catch(() => false);
  }
  readBufferContent() {
    return fs.readFile(this.#path).then((buffer) => new Uint8Array(buffer));
  }
  writeFile(buffer: Uint8Array) {
    return fs.writeFile(this.#path, buffer);
  }
  async getImageList() {
    return await fs.readdir(this.imageList$$()).catch(() => [] as string[]);
  }
  readImage(name: string) {
    return fs
      .readFile(path.join(this.imageList$$(), name))
      .then((buffer) => new Uint8Array(buffer));
  }

  async writeImage(fileName: string, buffer: Uint8Array) {
    await fs.mkdir(this.imageList$$(), { recursive: true });
    return fs.writeFile(path.join(this.dir, imgDirName, fileName), buffer);
  }
  async clear() {
    await fs.rm(this.#path, { force: true });
    await fs.rm(this.imageList$$(), { recursive: true, force: true });
  }
}
/** 普通文件 */
export class RawFile<T = any> {
  backupFile?: TempDirFlowFile;
  #filePath;
  #fileBuffer$$?: () => Promise<Uint8Array>;
  protected imgBufferMap = new Map<string, () => Promise<Uint8Array>>();
  #update$ = signal(0);
  #close?: () => Promise<undefined>;
  #init$$ = computed(() => {
    this.#update$();
    return (this.#close?.() ?? EmptyPromise)
      .then(() => openPromisify(path.normalize(this.#filePath), 'r'))
      .then(async (fd) => {
        const result = await fstatPromisify(fd);
        if (result.size === 0) {
          await fileClosePromisify(fd);
          return undefined;
        }
        return new Promise<void>(async (resolve, reject) => {
          const {
            default: { fromFd },
          } = await import('yauzl');
          fromFd(
            fd,
            { lazyEntries: true, autoClose: false },
            async (err, zipfile) => {
              if (err) {
                await fileClosePromisify(fd);
                return reject(err);
              }
              const readFileFn = (entry: Entry) =>
                new Promise<Uint8Array>((resolve, reject) => {
                  zipfile.openReadStream(
                    entry,
                    {
                      decompress: entry.isCompressed() ? true : null,
                      decrypt: null,
                      start: null,
                      end: null,
                    },
                    (err, readStream) => {
                      if (err) return reject(err);
                      const list: Uint8Array[] = [];
                      readStream.once('end', () => {
                        resolve(new Uint8Array(Buffer.concat(list)));
                        readStream.off('error', reject);
                      });
                      readStream.on('data', (chunk) => {
                        list.push(chunk);
                      });
                      readStream.once('error', reject);
                    },
                  );
                });
              zipfile.readEntry();
              zipfile.on('entry', (entry: Entry) => {
                if (entry.fileName === imgDirNameSlash) {
                } else if (entry.fileName === documentName) {
                  this.#fileBuffer$$ = computed(() => readFileFn(entry));
                } else if (entry.fileName.startsWith(imgDirNameSlash)) {
                  this.imgBufferMap.set(
                    entry.fileName.slice(imgDirNameSlash.length),
                    computed(() => readFileFn(entry)),
                  );
                }
                zipfile.readEntry();
              });

              zipfile.once('end', () => {
                this.#close = async () =>
                  new Promise(async (resolve) => {
                    this.#fileBuffer$$ = undefined;
                    this.imgBufferMap.clear();
                    zipfile.once('close', () => {
                      this.#close = undefined;
                      resolve(undefined);
                    });
                    zipfile.close();
                  });
                resolve();
              });
            },
          );
        }).catch(async (rej) => {
          this.#fileBuffer$$ = undefined;
          this.imgBufferMap.clear();
          await fileClosePromisify(fd);
          throw rej;
        });
      })
      .catch((rej) => {
        if (rej.code === 'ENOENT') {
          return undefined;
        }
        throw rej;
      });

    // todo 如果之前的文件不是zip那么就会异常
  });
  constructor(filePath: string) {
    this.#filePath = filePath;
  }

  getBackupDir() {
    return this.backupFile!.dir;
  }

  /** 只有编辑时设置,理论上根据context每次都一样 */
  setTemp(dir: string) {
    this.backupFile = new TempDirFlowFile(dir);
  }
  async #readBufferContent() {
    // 这里的备份文件很可能不存在,比如说被清理了或者其他异常情况
    if (await this.backupFile?.hasBackup()) {
      return this.backupFile!.readBufferContent();
    }
    return this.#init$$().then(async () =>
      this.#fileBuffer$$ ? this.#fileBuffer$$() : undefined,
    );
  }
  async readData() {
    const buffer = await this.#readBufferContent();
    return (buffer ? JSON.parse(Buffer.from(buffer).toString()) : {}) as T;
  }
  async readImageBuffer(imageName: string) {
    // todo需要优化一下
    const list = (await this.backupFile?.getImageList()) ?? [];
    if (list.includes(imageName)) {
      return this.backupFile!.readImage(imageName);
    }
    await this.#init$$();
    return this.imgBufferMap.get(imageName)?.();
  }
  readOriginData() {
    return this.#init$$().then(
      async () =>
        (this.#fileBuffer$$
          ? JSON.parse(Buffer.from(await this.#fileBuffer$$()).toString())
          : {}) as T,
    );
  }
  writeBackupDocument(data: Record<string, any>) {
    return this.backupFile!.writeFile(
      new Uint8Array(Buffer.from(JSON.stringify(data))),
    );
  }
  clearBackup() {
    return this.backupFile!.clear();
  }

  async save(data: Record<string, any>) {
    await this.saveAs(this.#filePath, data);
    this.#update$.update((a) => a + 1);
    return this.backupFile?.clear();
  }
  async mediaSave(data: Record<string, any>, tempZip: ZipFile) {}
  /** 另存为 */
  // 另存为是使用当前数据保存
  async saveAs(filePath: string, data: Record<string, any>) {
    await this.#init$$();
    const {
      default: { ZipFile },
    } = await import('yazl');
    const tempZip = new ZipFile();
    tempZip.addBuffer(Buffer.from(JSON.stringify(data)), documentName);
    await this.mediaSave(data, tempZip);

    tempZip.end();
    return new Promise<void>((resolve, reject) => {
      tempZip.outputStream
        .pipe(createWriteStream(filePath))
        .on('error', reject)
        .on('close', resolve);
    });
  }

  //! 必须来一个临时默认文件夹

  writeTempImage(fileName: string, buffer: Uint8Array) {
    return this.backupFile!.writeImage(fileName, buffer);
  }
  // 应该叫延迟更新?
  needCloseSelf = false;
  closeSelf() {
    if (this.needCloseSelf) {
      this.#update$.update((a) => a + 1);
    }
  }
  close() {
    return this.#close?.();
  }
}
