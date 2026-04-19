import { expect } from 'chai';
import { githubUrlDownload } from '../util/download';

describe('githubUrlDownload', () => {
  it('生成标准 GitHub 下载地址', () => {
    const fn = githubUrlDownload('owner/repo', 'artifact.zip', 'v1.0.0');
    const url = fn();
    expect(url).to.equal(
      'https://github.com/owner/repo/releases/download/v1.0.0/artifact.zip',
    );
  });

  it('使用自定义 URL 前缀', () => {
    const fn = githubUrlDownload('owner/repo', 'artifact.zip', 'v1.0.0');
    const url = fn('mirror.github.com');
    expect(url).to.equal(
      'https://mirror.github.com/owner/repo/releases/download/v1.0.0/artifact.zip',
    );
  });

  it('正确处理带有平台信息的文件名', () => {
    const fn = githubUrlDownload(
      'owner/repo',
      `app-1.0.0-win32-x64.zip`,
      '1.0.0',
    );
    const url = fn();
    expect(url).to.equal(
      'https://github.com/owner/repo/releases/download/1.0.0/app-1.0.0-win32-x64.zip',
    );
  });

  it('版本号不带 v 前缀', () => {
    const fn = githubUrlDownload('owner/repo', 'app.tar.gz', '2.3.1');
    const url = fn();
    expect(url).to.equal(
      'https://github.com/owner/repo/releases/download/2.3.1/app.tar.gz',
    );
  });
});
