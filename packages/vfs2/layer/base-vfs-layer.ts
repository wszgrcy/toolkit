import type { FSLayerType } from '../type';

export class BaseVfsLayer implements FSLayerType {
  parent?: FSLayerType;
  layerList!: FSLayerType[];
}
