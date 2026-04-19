import { createVfs } from './create-vfs';
import { PathVfsLayer } from './layer/path.layer';
import type { PathVfsLayerOptions } from './layer/path.layer';
import fs from 'fs';
import { FsUtil } from './util/fs.util';
import type { FSLayerType } from './type';
import { BaseVfsLayer } from './layer/base-vfs-layer';
export type NormalizeFs = Required<FSLayerType & FsUtil>;
export { FsUtil as __FsUtil };
export function createNormalizeVfs(options?: PathVfsLayerOptions): NormalizeFs {
  const layer = createVfs([new PathVfsLayer(options), fs.promises as any]);
  const util = new FsUtil(layer, options);
  const obj = Object.create(layer) as Record<string, any>;

  for (const key in util) {
    const method = (util as any)[key];
    (obj as any)[key] = method;
  }
  return obj as any;
}
export function createCustomVfs(
  layerList: BaseVfsLayer[],
  options?: PathVfsLayerOptions,
): NormalizeFs {
  const layer = createVfs([new PathVfsLayer(options), ...layerList]);
  const util = new FsUtil(layer, options);
  const obj = Object.create(layer) as Record<string, any>;

  for (const key in util) {
    const method = (util as any)[key];
    (obj as any)[key] = method;
  }
  return obj as any;
}

export { createVfs } from './create-vfs';
export { nPath as path } from './path';
export { BaseVfsLayer, FSLayerType };
export * from './type';
