import type { FSLayerType } from './type';
import { BaseVfsLayer } from './layer/base-vfs-layer';

export function createVfs(layerList: BaseVfsLayer[]): FSLayerType {
  if (!layerList.length) {
    throw new Error('数组不能未空');
  }

  if (layerList.length === 1) {
    layerList[0].layerList = [];
    return layerList[0];
  }
  let lastLayer;
  const fsKeys = [];
  const insertLayerList: FSLayerType[] = [];
  for (let i = layerList.length - 1; i > -1; i--) {
    const item = layerList[i];
    if (!lastLayer) {
      lastLayer = item.parent ?? item;
      for (const key in item) {
        if (key !== 'parent' && key !== 'layerList') {
          fsKeys.push(key);
        }
      }
      item.layerList = [];
    } else {
      item.layerList = insertLayerList.slice();
      item.parent = lastLayer;
      fsKeys.forEach((fsKey) => {
        if (
          !(fsKey in item) &&
          typeof (item.parent as any)[fsKey] === 'function'
        ) {
          (item as any)[fsKey] = (...args: any[]) =>
            (item.parent as any)[fsKey](...args);
        }
      });
      lastLayer = item;
    }
    insertLayerList.unshift(item);
  }
  return lastLayer!;
}
