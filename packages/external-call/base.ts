import { inject, Injector, signal, Signal } from 'static-injector';
import { path } from '@cyia/vfs2';
import fs from 'fs';
import semver from 'semver';
import { downloadFile, MessageType } from '@cyia/dl';
import { UnzipService } from '@cyia/zip';
import { SignalConstants, tmpdir } from 'os';
import { execa, ResultPromise } from 'execa';
import { DownloadConfigToken, GITHUB_URL_TOKEN, LogType } from './token';
import { githubUrlDownload } from './util/download';
import { LogService } from './log.service';
import { createDebugTime } from '@cyia/util';
import { externalExeExit, externalExeStop } from './exit-dispose';
const DefaultOptions = {
  extendEnv: true,
} as const;
export interface DownloadOptions {
  output: string;
  fileName?: string;
  progressMessage?: (item: MessageType) => void;
  signal?: AbortSignal;
  strip?: number;
  cleanDir?: boolean;
  disableUnzip?: boolean;
  headers?: Record<string, string>;
}
export class ExternalCallBaseService {
  logName!: string;
  startPath$$!: Signal<string>;
  execPath$$!: Signal<string>;
  checkFilePath$$!: Signal<string>;
  #unzip = inject(UnzipService);
  #githubUrl = inject(GITHUB_URL_TOKEN, { optional: true }) ?? undefined;
  exist$ = signal(false);
  #injector = inject(Injector);
  #downloadConfig = inject(DownloadConfigToken);
  #log?: LogType;
  get log() {
    return (
      this.#log ??
      (this.#log = this.#injector
        .get(LogService, undefined, { optional: true })
        ?.getToken(this.logName))
    );
  }
  protected instanceSnapshot: ResultPromise<{}>[] = [];
  constructor() {
    externalExeExit(() => this.instanceSnapshot);
  }
  async checkExist() {
    const result = await this.exist();
    this.exist$.set(result);
  }
  protected async exist() {
    const result = fs.existsSync(this.checkFilePath$$());
    if (!result) {
      this.log?.info(`检查文件[${this.checkFilePath$$()}]不存在`);
    }
    return result;
  }
  init(options?: any) {}
  exec(
    filePath: string,
    args: string[],
    options?: {
      // 当前文件夹
      cwd?: string;
      // 环境变量
      env?: Record<string, any>;
      extendEnv?: boolean;
      // 是否取消
      cancelSignal?: AbortSignal;
      // 超时
      timeout?: number;
      shell?: boolean;
      // 二进制文件搜索
      preferLocal?: boolean;
      localDir?: string;

      killSignal?: keyof SignalConstants | number;
      reject?: boolean;
      encoding?: string;
    },
  ) {
    const abortController = new AbortController();
    options = {
      ...DefaultOptions,
      ...options,
      cancelSignal: abortController.signal,
    };
    const instance = execa(options as any)(
      filePath,
      args,
    ) as any as ResultPromise<{}>;
    return { instance, abortController };
  }

  download(url: string | string[], options: DownloadOptions) {
    const obj = {} as Record<string, any>;
    const tmpOutput = path.join(tmpdir(), Math.random().toString(36).slice(2));
    if (options.fileName) {
      (obj as any).savePath = path.resolve(tmpOutput, options.fileName);
    } else {
      (obj as any).directory = tmpOutput;
    }
    return downloadFile(url, {
      ...this.#downloadConfig(),
      ...obj,
      message: options.progressMessage,
      signal: options.signal,
      headers: options.headers,
    }).then(async (result) => {
      if (!result) {
        throw new Error('下载失败');
      }
      const filePath = result.getFilePath();
      this.log?.info(`下载成功,临时保存:${filePath}`);
      const calcTime = createDebugTime();
      let isUnZip = false;
      if (!options.disableUnzip) {
        options.progressMessage?.({ type: 'message', data: '准备解压' });
        isUnZip = await this.#unzip.autoUnzip(filePath, options.output, {
          removeZip: true,
          strip: options.strip,
          clean: options.cleanDir ?? true,
        });
        options.progressMessage?.({
          type: 'message',
          data: `解压完成,用时: ${calcTime()}s`,
        });
      }
      if (!isUnZip) {
        this.log?.info(`文件非压缩包，直接复制: ${filePath}`);
        await fs.promises.cp(filePath, options.output, {
          recursive: true,
          force: true,
        });
        try {
          await fs.promises.rm(filePath, { recursive: true, force: true });
        } catch (error) {
          this.log?.warn(`清理临时文件失败: ${filePath}`, error);
        }
      }
      this.log?.info(`${filePath}->${options.output}`);
    });
  }

  /** 下载release下的文件 */
  githubRepoDownload(
    metadata: {
      prefix: string;
      version: string;
      fileName: string;
      size?: number;
    },
    options: DownloadOptions,
  ) {
    const url = githubUrlDownload(
      metadata.prefix,
      metadata.fileName,
      metadata.version,
    )(this.#githubUrl?.());
    this.log?.info('下载地址', url);
    if (typeof metadata.size === 'number' && metadata.size > 0) {
      return this.githubRepoDownloadBatch(url, metadata as any, options);
    }

    return this.download(url, options);
  }
  githubRepoDownloadBatch(
    url: string,
    metadata: {
      // prefix: string;
      // version: string;
      fileName: string;
      size: number;
    },
    options: DownloadOptions,
  ) {
    return this.download(
      new Array(metadata.size)
        .fill(undefined)
        .map((_, index) => `${url}.${(index + 1).toString().padStart(3, '0')}`),
      { ...options, fileName: metadata.fileName },
    );
  }
  protected getVersion(): Promise<string | undefined> {
    throw new Error('未实现');
  }
  async checkVersion(latestVersion: string) {
    const currentVersion = await this.getVersion();
    if (!currentVersion) {
      return false;
    }
    try {
      this.log?.info(
        `进行版本比较,最新:${latestVersion},当前:${currentVersion}`,
      );
      return semver.gt(latestVersion, currentVersion);
    } catch (error) {
      const latestVersionN = +latestVersion;
      const currentVersionN = +currentVersion;
      if (!Number.isNaN(latestVersionN) && !Number.isNaN(currentVersionN)) {
        return latestVersionN > currentVersionN;
      }
      return false;
    }
  }
  stop() {
    externalExeStop(() => this.instanceSnapshot, this.log?.warn);
    this.instanceSnapshot = [];
    this.log?.info('已停止');
  }
  destroy() {
    this.log?.info('服务已销毁');
  }
}
