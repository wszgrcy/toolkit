import { expect } from 'chai';
import semver from 'semver';
import { ExternalCallBaseService } from '../base';
import { createRootInjector, signal } from 'static-injector';
import { DownloadConfigToken } from '../token';
describe('external-call', () => {
  it.skip('版本', () => {
    console.log(semver.gt('12', '11', true));
  });
  it('版本测试1', async () => {
    class TestVersion extends ExternalCallBaseService {
      protected async getVersion(): Promise<string | undefined> {
        return '119';
      }
    }
    const injector = createRootInjector({
      providers: [
        TestVersion,
        { provide: DownloadConfigToken, useValue: signal({}) },
      ],
    });
    const instance = injector.get(TestVersion);
    const result = await instance.checkVersion('121');
    expect(result).eq(true);
  });
  it('版本测试2', async () => {
    class TestVersion extends ExternalCallBaseService {
      protected async getVersion(): Promise<string | undefined> {
        return 'v1.1.1';
      }
    }
    const injector = createRootInjector({
      providers: [
        TestVersion,
        { provide: DownloadConfigToken, useValue: signal({}) },
      ],
    });
    const instance = injector.get(TestVersion);
    const result = await instance.checkVersion('v1.2.2');
    expect(result).eq(true);
  });
  it('版本测试(小于)', async () => {
    class TestVersion extends ExternalCallBaseService {
      protected async getVersion(): Promise<string | undefined> {
        return '1.2.2';
      }
    }
    const injector = createRootInjector({
      providers: [
        TestVersion,
        { provide: DownloadConfigToken, useValue: signal({}) },
      ],
    });
    const instance = injector.get(TestVersion);
    const result = await instance.checkVersion('1.1.1');
    expect(result).eq(false);
  });
  it('版本测试(异常)', async () => {
    class TestVersion extends ExternalCallBaseService {
      protected async getVersion(): Promise<string | undefined> {
        return 'sdfsf';
      }
    }
    const injector = createRootInjector({
      providers: [
        TestVersion,
        { provide: DownloadConfigToken, useValue: signal({}) },
      ],
    });
    const instance = injector.get(TestVersion);
    const result = await instance.checkVersion('1.1.1');
    expect(result).eq(false);
  });
});
