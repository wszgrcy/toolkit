import { InjectionToken, Signal } from 'static-injector';

import * as v from 'valibot';
export const GITHUB_URL_TOKEN = new InjectionToken<Signal<string>>(
  'GITHUB_URL',
);
export const HUGGINGFACE_URL_TOKEN = new InjectionToken<Signal<string>>(
  'HUGGINGFACE_URL',
);
export const HUGGINGFACE_TOKEN_TOKEN = new InjectionToken<Signal<string>>(
  'HUGGINGFACE_TOKEN',
);
export type LogType = {
  info: (...args: any) => void;
  warn: (...args: any) => void;
  error: (...args: any) => void;
};
export const LogFactoryToken = new InjectionToken<(name: string) => LogType>(
  'Log',
);

export const DownloadConfigDefine = v.object({
  connectionCount: v.pipe(
    v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(32)), 4),
    v.title('下载连接数'),
  ),
  lowSpeed: v.pipe(
    v.optional(v.number(), 300),
    v.title('低速重启(KB)'),
    v.description('低于此速度开始计算低速超时时间'),
  ),
  lowStopTimeout: v.pipe(
    v.optional(v.number(), 10_000),
    v.title('低速超时(毫秒)'),
    v.description('一定时间内下载速度过低尝试重启下载'),
  ),
  heartbeatStopTimeout: v.pipe(
    v.optional(v.number(), 10_000),
    v.title('心跳停止超时(毫秒)'),
    v.description('一定时间内未检测到下载数据后尝试重启下载'),
  ),
  // maxTryCount: v.pipe(v.optional(v.number(), 5), v.title('异常重试'), v.description('下载抛出异常时,会尝试重启下载')),
});
export type DownloadConfigType = v.InferOutput<typeof DownloadConfigDefine>;
export const DownloadConfigToken = new InjectionToken<
  Signal<DownloadConfigType>
>('DownloadConfig');
