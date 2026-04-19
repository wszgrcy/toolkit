import type fs from 'fs/promises';
import type { ConditionalPick } from 'type-fest';
export type FSType = ConditionalPick<typeof fs, (...args: any[]) => any>;

export type FSLayerType = Partial<FSType> & {
  parent?: FSLayerType;
  layerList: FSLayerType[];
};
// let list = [];
// for (const key in fs) {
//   const element = (fs as any)[key];
//   if (typeof element === 'function') {
//     list.push(key);
//   }
// }
// // console.log(list);
// for (const item of list) {
//   console.log(`${item}(path:string,...args:ArraySlice<Parameters<FSType['${item}']>,1>){
//     return this.parent?.${item}?.(this.resolvePath(path),...args)
//     }`);
// }
