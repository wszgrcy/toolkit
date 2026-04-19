import { spawnSync } from 'child_process';
import { ResultPromise } from 'execa';
import { isNumber } from 'es-toolkit/compat';

export function externalExeStop(
  instanceFn: () => ResultPromise<{}>[],
  logFn?: (arg: any) => void,
) {
  const instanceList = instanceFn();
  if (!instanceList?.length) {
    return;
  }

  if (process.platform === 'win32') {
    instanceList.forEach((item) => {
      if (isNumber(item.pid)) {
        try {
          spawnSync('taskkill', ['/pid', `${item.pid}`, '/T', '/F']);
        } catch (error) {
          logFn?.(error);
        } finally {
        }
      }
    });
  }
  instanceList.forEach((item) => {
    try {
      item.kill();
    } catch (error) {
      logFn?.(error);
    } finally {
    }
  });
}
export function externalExeExit(instanceFn: () => ResultPromise<{}>[]) {
  process.once('exit', () => {
    externalExeStop(instanceFn);
  });
}
