import { ExternalCallBaseService } from '../base';
import { createRootInjector } from 'static-injector';
import { LogFactoryToken } from '../token';
import { LogService } from '../log.service';
import path from 'path';
import { githubUrlDownload } from '../util/download';
describe('下载', () => {
  it.skip('批量下载', async () => {
    class TestA extends ExternalCallBaseService {
      logName = 'testa';
      test1(a: any) {}
      test2(a: any) {}
      test3(a: any) {}
    }
    const init = 0;
    const injector = createRootInjector({
      providers: [
        TestA,
        {
          provide: LogFactoryToken,
          useValue: (value: string) => ({
            info: (data: any) => data,
            warn: (data: any) => data,
            error: (data: any) => data,
          }),
        },
        LogService,
      ],
    });
    const service = injector.get(TestA);
    await service.githubRepoDownloadBatch(
      githubUrlDownload(
        'wszgrcy/shb-python-addon-repo',
        `shb-python-addon-1.1.0-${process.platform}-${process.arch}-rocm.tar.zstd`,
        '1.1.0',
      )(),
      {
        fileName: `shb-python-addon-1.1.0-${process.platform}-${process.arch}-rocm.tar.zstd`,
        size: 2,
      },
      { output: path.join(process.cwd(), '.tmp', 'lib') },
    );
  });
});
