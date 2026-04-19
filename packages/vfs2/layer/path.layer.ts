import { BaseVfsLayer } from './base-vfs-layer';
import normalizePath from 'normalize-path';
import type { FSType } from '../type';
import type { ArraySlice } from 'type-fest';
import { resolvePath } from '../util/resolve-path';
export interface PathVfsLayerOptions {
  dir?: string;
}
/** */
export class PathVfsLayer extends BaseVfsLayer {
  options?: PathVfsLayerOptions;
  constructor(options?: PathVfsLayerOptions) {
    super();
    if (options) {
      this.setOptions(options);
    }
  }
  setOptions(options: PathVfsLayerOptions) {
    if (options.dir) {
      this.options = { dir: normalizePath(options.dir) };
    }
  }
  #resolvePath(str: string) {
    return resolvePath(str, this.options?.dir);
  }

  access = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['access']>, 1>
  ) => this.parent!.access?.(this.#resolvePath(path), ...args);
  copyFile = (
    src: string,
    dest: string,
    ...args: ArraySlice<Parameters<FSType['copyFile']>, 2>
  ) =>
    this.parent!.copyFile?.(
      this.#resolvePath(src),
      this.#resolvePath(dest),
      ...args,
    );
  cp = (
    src: string,
    dest: string,
    ...args: ArraySlice<Parameters<FSType['cp']>, 2>
  ) =>
    this.parent!.cp?.(this.#resolvePath(src), this.#resolvePath(dest), ...args);
  open = (path: string, ...args: ArraySlice<Parameters<FSType['open']>, 1>) =>
    this.parent!.open?.(this.#resolvePath(path), ...args);
  opendir = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['opendir']>, 1>
  ) => this.parent!.opendir?.(this.#resolvePath(path), ...args);
  rename = (
    oldPath: string,
    newPath: string,
    ...args: ArraySlice<Parameters<FSType['rename']>, 2>
  ) =>
    this.parent!.rename?.(
      this.#resolvePath(oldPath),
      this.#resolvePath(newPath),
      ...args,
    );
  truncate = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['truncate']>, 1>
  ) => this.parent!.truncate?.(this.#resolvePath(path), ...args);
  rm = (path: string, ...args: ArraySlice<Parameters<FSType['rm']>, 1>) =>
    this.parent!.rm?.(this.#resolvePath(path), ...args);
  rmdir = (path: string, ...args: ArraySlice<Parameters<FSType['rmdir']>, 1>) =>
    this.parent!.rmdir?.(this.#resolvePath(path), ...args);
  mkdir = (path: string, ...args: ArraySlice<Parameters<FSType['mkdir']>, 1>) =>
    this.parent!.mkdir?.(this.#resolvePath(path), ...args);
  readdir = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['readdir']>, 1>
  ) => this.parent!.readdir?.(this.#resolvePath(path), ...args);
  readlink = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['readlink']>, 1>
  ) => this.parent!.readlink?.(this.#resolvePath(path), ...args);

  symlink = (
    target: string,
    path: string,
    ...args: ArraySlice<Parameters<FSType['symlink']>, 2>
  ) =>
    this.parent!.symlink?.(
      this.#resolvePath(target),
      this.#resolvePath(path),
      ...args,
    );
  lstat = (path: string, ...args: ArraySlice<Parameters<FSType['lstat']>, 1>) =>
    this.parent!.lstat?.(this.#resolvePath(path), ...args);
  stat = (path: string, ...args: ArraySlice<Parameters<FSType['stat']>, 1>) =>
    this.parent!.stat?.(this.#resolvePath(path), ...args);
  statfs = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['statfs']>, 1>
  ) => this.parent!.statfs?.(this.#resolvePath(path), ...args);
  link = (
    existingPath: string,
    newPath: string,
    ...args: ArraySlice<Parameters<FSType['link']>, 2>
  ) =>
    this.parent!.link?.(
      this.#resolvePath(existingPath),
      this.#resolvePath(newPath),
      ...args,
    );
  unlink = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['unlink']>, 1>
  ) => this.parent!.unlink?.(this.#resolvePath(path), ...args);
  chmod = (path: string, ...args: ArraySlice<Parameters<FSType['chmod']>, 1>) =>
    this.parent!.chmod?.(this.#resolvePath(path), ...args);
  lchmod = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['lchmod']>, 1>
  ) => this.parent!.lchmod?.(this.#resolvePath(path), ...args);
  lchown = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['lchown']>, 1>
  ) => this.parent!.lchown?.(this.#resolvePath(path), ...args);
  chown = (path: string, ...args: ArraySlice<Parameters<FSType['chown']>, 1>) =>
    this.parent!.chown?.(this.#resolvePath(path), ...args);
  utimes = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['utimes']>, 1>
  ) => this.parent!.utimes?.(this.#resolvePath(path), ...args);
  lutimes = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['lutimes']>, 1>
  ) => this.parent!.lutimes?.(this.#resolvePath(path), ...args);
  realpath = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['realpath']>, 1>
  ) => this.parent!.realpath?.(this.#resolvePath(path), ...args);
  mkdtemp = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['mkdtemp']>, 1>
  ) => this.parent!.mkdtemp?.(this.#resolvePath(path), ...args);
  writeFile = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['writeFile']>, 1>
  ) => this.parent!.writeFile?.(this.#resolvePath(path), ...args);
  appendFile = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['appendFile']>, 1>
  ) => this.parent!.appendFile?.(this.#resolvePath(path), ...args);
  readFile = (
    path: string,
    ...args: ArraySlice<Parameters<FSType['readFile']>, 1>
  ) => this.parent!.readFile?.(this.#resolvePath(path), ...args);
  watch = (path: string, ...args: ArraySlice<Parameters<FSType['watch']>, 1>) =>
    this.parent!.watch?.(this.#resolvePath(path), ...args);
}
