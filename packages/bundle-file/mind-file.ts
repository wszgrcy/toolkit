import { ZipFile } from 'yazl';
import { imgDirNameSlash, RawFile } from './raw-file';
interface CardChild {
  type: string;
  children?: CardChild[];
  options: any;
}
/** 脑图文件 */
export class MindFile<T = any> extends RawFile<T> {
  override async mediaSave({ id, flow, storeList }: any, tempZip: ZipFile) {
    if (!id) {
      return;
    }
    const nodeList = [...(flow.nodes ?? []), ...(storeList ?? [])];

    const imgNameSet = new Set<string>();
    for (const item of nodeList) {
      if (item.type === 'image') {
        if (item.data.value?.src) {
          imgNameSet.add(item.data.value.src);
        }
      } else if (item.type === 'card') {
        if (item.data.value?.editorState?.root) {
          this.#findImageInCard(item.data.value.editorState.root, imgNameSet);
        }
      }
    }
    const tempList = (await this.backupFile?.getImageList()) || [];
    // 先从临时获取,临时没有从之前保存的取
    for (const photoName of imgNameSet) {
      if (tempList.includes(photoName)) {
        tempZip.addBuffer(
          Buffer.from(await this.backupFile!.readImage(photoName)),
          `${imgDirNameSlash}${photoName}`,
        );
      } else {
        const file = this.imgBufferMap.get(photoName)?.();
        if (file) {
          tempZip.addBuffer(
            Buffer.from(await file),
            `${imgDirNameSlash}${photoName}`,
          );
        }
      }
    }
  }
  /** 查找卡片的图片 */
  #findImageInCard(data: CardChild, fileSet: Set<string>) {
    if (data.type === 'image') {
      fileSet.add(data.options.src);
    } else if (data.children) {
      for (const item of data.children) {
        this.#findImageInCard(item, fileSet);
      }
    }
  }
}
