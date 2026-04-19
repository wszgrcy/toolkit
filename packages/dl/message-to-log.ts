import { MessageType } from './download';

export function createMessage2Log() {
  let lastPercent: number | undefined;
  return (item: MessageType) => {
    if (item.type === 'status') {
      if (item.data === 2) {
        lastPercent = 0;
        return {
          type: 'message',
          value: 0,
          message: `低速超时,准备重启下载`,
        };
      } else if (item.data === 3) {
        lastPercent = 0;
        return {
          type: 'message',
          value: 0,
          message: `心跳停止,准备重启下载`,
        };
      } else if (item.data === 4) {
        lastPercent = 0;
        return {
          type: 'message',
          value: 0,
          message: `异常的下载中断,准备重启下载`,
        };
      }
    } else if (item.type === 'loading') {
      const progress = item.data;
      lastPercent = progress.percentage;
      return {
        type: 'message',
        value: progress.percentage,
        message: `${progress.fileName}:${progress.percentage.toFixed(2)}% ${(progress.speed / 1024 / 1024).toFixed(2)}MB/s`,
      };
    } else if (item.type === 'message') {
      return {
        type: 'message',
        message: item.data,
        value: item.value ?? lastPercent ?? 0,
      };
    }
    return undefined;
  };
}
