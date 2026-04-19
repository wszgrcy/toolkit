import isRelative from 'is-relative';
import normalizePath from 'normalize-path';
import path from 'path';

export function resolvePath(str: string, dir?: string) {
  if (isRelative(str)) {
    if (!dir) {
      throw new Error(`使用相对路径[${str}]时未设置文件夹`);
    }
    return path.join(dir, normalizePath(str));
  }
  return normalizePath(str);
}
