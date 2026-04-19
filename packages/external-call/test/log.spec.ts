import { expect } from 'chai';
import { ExternalCallBaseService } from '../base';
import { createRootInjector, signal } from 'static-injector';
import { DownloadConfigToken, LogFactoryToken } from '../token';
import { LogService } from '../log.service';

describe('日志', () => {
  // 好像只能1.2.3这种?
  it('版本', () => {
    let infoCount = 0;
    let warnCount = 0;
    let errorCount = 0;
    class TestA extends ExternalCallBaseService {
      logName = 'testa';
      test1(a: any) {
        this.log?.info(a);
        infoCount++;
        expect(a).ok;
      }
      test2(a: any) {
        this.log?.warn(a);
        warnCount++;
        expect(a).ok;
      }
      test3(a: any) {
        this.log?.error(a);
        errorCount++;
        expect(a).ok;
      }
    }
    let init = 0;
    const injector = createRootInjector({
      providers: [
        TestA,
        {
          provide: LogFactoryToken,
          useValue: (value: string) => {
            expect(value).ok;
            init++;
            return {
              info: (data: any) => data,
              warn: (data: any) => data,
              error: (data: any) => data,
            };
          },
        },
        LogService,
        { provide: DownloadConfigToken, useValue: signal({}) },
      ],
    });
    const service = injector.get(TestA);

    service.test1('11');
    expect(infoCount).eq(1);
    expect(warnCount).eq(0);
    expect(errorCount).eq(0);
    service.test2('22');
    expect(infoCount).eq(1);
    expect(warnCount).eq(1);
    expect(errorCount).eq(0);
    service.test3('33');
    expect(infoCount).eq(1);
    expect(warnCount).eq(1);
    expect(errorCount).eq(1);
    expect(init).eq(1);
  });

  describe('LogService', () => {
    it('获取 token 时传递正确的名称', () => {
      let passedName: string | undefined;
      const mockLogFactory = ((name: string) => ({
        info: () => {},
        warn: () => {},
        error: () => {},
      })) as any;
      const original = mockLogFactory;
      const injector = createRootInjector({
        providers: [
          {
            provide: LogFactoryToken,
            useValue: (name: string) => {
              passedName = name;
              return {
                info: () => {},
                warn: () => {},
                error: () => {},
              };
            },
          },
          LogService,
        ],
      });
      const service = injector.get(LogService);
      service.getToken('testLog');
      expect(passedName).to.equal('testLog');
    });

    it('返回的 token 包含 info/warn/error 方法', () => {
      const injector = createRootInjector({
        providers: [
          {
            provide: LogFactoryToken,
            useValue: () => ({
              info: (msg: string) => msg,
              warn: (msg: string) => msg,
              error: (msg: string) => msg,
            }),
          },
          LogService,
        ],
      });
      const service = injector.get(LogService);
      const token = service.getToken('test');
      expect(token).to.not.be.undefined;
      expect(token!.info).to.be.a('function');
      expect(token!.warn).to.be.a('function');
      expect(token!.error).to.be.a('function');
    });

    it('LogFactoryToken 未注入时 getToken 返回 undefined', () => {
      const injector = createRootInjector({
        providers: [LogService],
      });
      const service = injector.get(LogService);
      const token = service.getToken('test');
      expect(token).to.be.undefined;
    });

    it('多次调用 getToken 返回不同的 token 实例', () => {
      let callCount = 0;
      const injector = createRootInjector({
        providers: [
          {
            provide: LogFactoryToken,
            useValue: () => {
              callCount++;
              return {
                info: () => {},
                warn: () => {},
                error: () => {},
              };
            },
          },
          LogService,
        ],
      });
      const service = injector.get(LogService);
      service.getToken('log1');
      service.getToken('log2');
      expect(callCount).to.equal(2);
    });
  });

  describe('ExternalCallBaseService log getter', () => {
    it('首次访问 log 时从 LogService 获取', () => {
      let logAccessed = false;
      class TestLog extends ExternalCallBaseService {
        logName = 'testLog';
      }
      const injector = createRootInjector({
        providers: [
          TestLog,
          {
            provide: LogFactoryToken,
            useValue: () => {
              logAccessed = true;
              return {
                info: () => {},
                warn: () => {},
                error: () => {},
              };
            },
          },
          LogService,
          { provide: DownloadConfigToken, useValue: signal({}) },
        ],
      });
      const service = injector.get(TestLog);
      expect(logAccessed).to.be.false;
      const _ = service.log;
      expect(logAccessed).to.be.true;
    });

    it('log 被缓存，第二次访问不重新创建', () => {
      let logCreationCount = 0;
      class TestLogCache extends ExternalCallBaseService {
        logName = 'testCache';
      }
      const injector = createRootInjector({
        providers: [
          TestLogCache,
          {
            provide: LogFactoryToken,
            useValue: () => {
              logCreationCount++;
              return {
                info: () => {},
                warn: () => {},
                error: () => {},
              };
            },
          },
          LogService,
          { provide: DownloadConfigToken, useValue: signal({}) },
        ],
      });
      const service = injector.get(TestLogCache);
      const _ = service.log;
      const __ = service.log;
      const ___ = service.log;
      expect(logCreationCount).to.equal(1);
    });

    it('LogService 未注入时 log 返回 undefined', () => {
      class TestNoLog extends ExternalCallBaseService {
        logName = 'testNoLog';
      }
      const injector = createRootInjector({
        providers: [
          TestNoLog,
          { provide: DownloadConfigToken, useValue: signal({}) },
        ],
      });
      const service = injector.get(TestNoLog);
      expect(service.log).to.be.undefined;
    });
  });
});
