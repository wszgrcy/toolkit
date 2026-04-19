import type { FSLayerType, FSType } from '../type';

export class BaseVfsLayer implements FSLayerType {
  parent?: FSLayerType;
  layerList!: FSLayerType[];
}
