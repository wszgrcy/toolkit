import {
  DownloadFlags,
  DownloadStatus,
  downloadFile as iDownloadFile,
  DownloadFileOptions as IDownloadFileOptions,
} from 'ipull';
import { sampleTime, Subject } from 'rxjs';
import { withResolvers } from './util';
import path from 'path';
import { filterObjectEmptyKey } from '@cyia/util';
export interface ProgressItem {
  transferredBytes: number;
  totalBytes: number;
  speed: number;
  percentage: number;
  timeLeft: number;
  ended: boolean;
  fileName?: string;
  comment?: string;
  totalDownloadParts: number;
  downloadPart: number;
  startTime: number;
  endTime: number;
  transferAction: string;
  downloadStatus: DownloadStatus;
  downloadFlags: DownloadFlags[];
}
/** 二选一 */
type PathOptions = {
  directory: string;
  savePath: string;
  partURLs: string[];
  url: string;
};
export type EndStatus = 0 | 1 | 2 | 3 | 4;
export interface MessageStatus {
  type: 'status';
  data: EndStatus;
}
export interface LoadingMessage {
  type: 'loading';
  data: ProgressItem;
}
export interface MessageMessage {
  type: 'message';
  data: string;
  value?: number;
}
export type MessageType = MessageStatus | LoadingMessage | MessageMessage;
export interface _CustomDownloadFileOptions {
  signal?: AbortSignal;
  /** 低速超时 */
  lowStopTimeout?: number;
  /** 低速阈值 */
  lowSpeed?: number;
  /** 心跳超时 */
  heartbeatStopTimeout?: number;
  message?: (item: MessageType) => void;
  /** 进度采样,防止数据过多 */
  progressSampleTime?: number;
  /** 重试 */
  retry?: {
    /** 重试次数 */
    retries: number;
    /** 每次重试比上一次多等待的时间 */
    factor: number;
    /** 最小重试时间 */
    minTimeout: number;
    /** 最大重试时间(Math.min(minTimeout*factor,maxTimeout)) */
    maxTimeout: number;
  };
  connectionCount?: number;
  chunkSize?: number;
  directory?: string;
  savePath?: string;
  maxTryCount?: number;
}
export type DownloadFileOptions = _CustomDownloadFileOptions &
  Omit<IDownloadFileOptions, keyof _CustomDownloadFileOptions>;
export const DefaultOptions: DownloadFileOptions = {
  heartbeatStopTimeout: 10_000,
  lowStopTimeout: 10_000,
  lowSpeed: 100,
  progressSampleTime: 200,
  retry: {
    retries: 5,
    factor: 1.5,
    minTimeout: 1_000,
    maxTimeout: 8_000,
  },
  connectionCount: 8,
  chunkSize: 1024 * 1024 * 10,
  maxTryCount: 5,
} as const;
export async function downloadFile(
  url: string | string[],
  options?: DownloadFileOptions,
): Promise<
  | {
      getFilePath: () => string;
    }
  | undefined
> {
  options = { ...DefaultOptions, ...filterObjectEmptyKey(options) };
  try {
    while (true) {
      const { end$$, getFilePath } = await downloadFileStop(url, options);
      const end = await end$$;
      options?.message?.({ type: 'status', data: end as any });
      switch (end) {
        // 正常
        case 0:
          return { getFilePath: getFilePath! };
        // signal
        case 1:
          return undefined;
        // lowSpeed
        case 2:
          break;
        // heart
        case 3:
          break;
      }
    }
  } catch (error) {
    if (options?.maxTryCount) {
      options?.message?.({ type: 'status', data: 4 as any });

      return downloadFile(url, {
        ...options,
        maxTryCount: options.maxTryCount - 1,
      });
    } else {
      throw error;
    }
  }
}

/**
 * 两种情况,1正常速度下降
 * 2.卡住
 */
export async function downloadFileStop(
  url: string | string[],
  options: DownloadFileOptions,
) {
  const endType$ = withResolvers<number>();
  /** 监听进度并发射 */
  const progress$ = new Subject<any>();
  let progressStopId: any;
  // 停止时自动停止进度
  endType$.promise.finally(() => {
    progress$.complete();
    clearTimeout(progressStopId);
  });
  if (options.signal?.aborted) {
    endType$.resolve(1);
    return { end$$: endType$.promise };
  }
  const obj = {} as Partial<PathOptions>;
  if (options.directory) {
    obj['directory'] = options.directory;
  } else if (options.savePath) {
    obj['savePath'] = options.savePath;
  }
  if (typeof url === 'string') {
    obj['url'] = url;
  } else if (url.length === 1) {
    obj['url'] = url[0];
  } else {
    obj['partURLs'] = url;
  }
  const downloader = await iDownloadFile({
    cliProgress: false,
    skipExisting: true,
    parallelStreams: options.connectionCount!,
    retry: options.retry!,
    chunkSize: options.chunkSize,
    headers: options.headers,
    ...(obj as any),
  });
  /** 只执行一次停止 */
  let isStop = false;
  async function stopDownload(status: number) {
    if (isStop) {
      return;
    }
    isStop = true;
    return downloader
      .close({
        deleteTempFile: false,
        deleteFile: false,
      })
      .finally(() => {
        endType$.resolve(status);
      });
  }
  if (options.signal?.aborted) {
    endType$.resolve(1);
    return { end$$: endType$.promise };
  }
  /** 心跳检测 */
  const heartbeatStopEmit = (end: boolean) => {
    clearTimeout(progressStopId);
    if (!end) {
      progressStopId = setTimeout(async () => {
        stopDownload(3);
      }, options.heartbeatStopTimeout!);
    }
  };

  if (options.message) {
    progress$
      .pipe(sampleTime(options.progressSampleTime!))
      .subscribe((item) => {
        options.message!({ type: 'loading', data: item });
      });
  } else {
    progress$.complete();
  }

  // signal支持,自动停止
  options.signal?.addEventListener(
    'abort',
    (ev) => {
      clearTimeout(progressStopId);
      stopDownload(1);
    },
    { once: true },
  );

  let lowTimeStart = Date.now();
  let lowTimeEnd;
  heartbeatStopEmit(false);
  let fullPath = options.savePath;

  downloader.on('progress', (item) => {
    progress$.next(item);
    heartbeatStopEmit(item.ended);
    if (item.speed / 1024 < options.lowSpeed! && !item.ended) {
      lowTimeEnd = Date.now();
      if (lowTimeEnd - lowTimeStart > options.lowStopTimeout!) {
        setTimeout(() => {
          stopDownload(2);
        }, 0);
      }
    } else {
      lowTimeStart = Date.now();
    }
    if (item.ended && options.directory) {
      fullPath = path.join(options.directory, item.fileName);
    }
  });

  downloader
    .download()
    .then(() => {
      endType$.resolve(0);
    })
    .catch(async (rej) => {
      try {
        await downloader.close({
          deleteTempFile: false,
          deleteFile: false,
        });
      } catch (error) {}
      endType$.reject(rej);
    });
  return {
    end$$: endType$.promise,
    getFilePath: () => fullPath!,
  };
}
