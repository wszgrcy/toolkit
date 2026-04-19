import { expect } from 'chai';
import { externalExeStop } from '../exit-dispose';
import { ResultPromise } from 'execa';

describe('exit-dispose', () => {
  describe('externalExeStop', () => {
    it('空数组时直接返回', () => {
      let logCalled = false;
      const logFn = () => {
        logCalled = true;
      };
      externalExeStop(() => [], logFn);
      expect(logCalled).to.be.false;
    });

    it('无实例时直接返回', () => {
      let logCalled = false;
      const logFn = () => {
        logCalled = true;
      };
      externalExeStop(() => undefined as any, logFn);
      expect(logCalled).to.be.false;
    });

    it('有实例时调用 kill', () => {
      let killCalled = false;
      const mockInstance = {
        pid: 12345,
        kill: () => {
          killCalled = true;
        },
      } as any as ResultPromise<{}>;
      externalExeStop(() => [mockInstance]);
      expect(killCalled).to.be.true;
    });

    it('kill 抛出异常时不中断', () => {
      const mockInstance = {
        pid: 12345,
        kill: () => {
          throw new Error('kill failed');
        },
      } as any as ResultPromise<{}>;
      expect(() => externalExeStop(() => [mockInstance])).to.not.throw();
    });

    it('kill 抛出异常时记录日志', () => {
      let logError: any;
      const mockInstance = {
        pid: 12345,
        kill: () => {
          throw new Error('kill failed');
        },
      } as any as ResultPromise<{}>;
      const logFn = (err: any) => {
        logError = err;
      };
      externalExeStop(() => [mockInstance], logFn);
      expect(logError).to.be.an('error');
      expect(logError.message).to.equal('kill failed');
    });

    it('无 pid 时跳过 taskkill 但仍调用 kill', () => {
      let killCalled = false;
      const mockInstance = {
        kill: () => {
          killCalled = true;
        },
      } as any as ResultPromise<{}>;
      externalExeStop(() => [mockInstance]);
      expect(killCalled).to.be.true;
    });
  });
});
