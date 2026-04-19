import isRelative from 'is-relative';
import normalizePath from 'normalize-path';
import path from 'path';
// console.log(path);
// let list = [];
// for (const key in path) {
//   const element = (path as any)[key];
//   if (typeof element === 'function') {
//     list.push(key);
//   }
// }
// console.log(
//   list
//     .map((key) => {
//       return `${key}:(filePath:string)=>path.${key}(normalizePath(filePath))`;
//     })
//     .join(',\n')
// );

export const nPath = {
  resolve: (...paths: string[]) =>
    normalizePath(path.resolve(...paths.map((item) => normalizePath(item)))),
  normalize: (filePath: string) =>
    normalizePath(path.normalize(normalizePath(filePath))),
  isAbsolute: (filePath: string) => path.isAbsolute(normalizePath(filePath)),
  isRelative: isRelative,
  join: (...paths: string[]) =>
    normalizePath(path.join(...paths.map((item) => normalizePath(item)))),
  relative: (from: string, to: string) =>
    normalizePath(path.relative(normalizePath(from), normalizePath(to))),
  toNamespacedPath: (filePath: string) =>
    normalizePath(path.toNamespacedPath(normalizePath(filePath))),
  dirname: (filePath: string) =>
    normalizePath(path.dirname(normalizePath(filePath))),
  basename: (filePath: string, suffix?: string) =>
    path.basename(normalizePath(filePath), suffix),
  extname: (filePath: string) => path.extname(normalizePath(filePath)),
  format: (...args: Parameters<(typeof path)['format']>) =>
    normalizePath(path.format(...args)),
  parse: (filePath: string) => path.parse(normalizePath(filePath)),
} as any as typeof path & { isRelative: typeof isRelative };
