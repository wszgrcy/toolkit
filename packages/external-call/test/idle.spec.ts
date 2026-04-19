import { createIdleClean } from '../idle-clean';
describe('idle', () => {
  // 好像只能1.2.3这种?
  it('测试多次停止', () => {
    const ref = createIdleClean(() => {
      throw new Error('');
    }, 99999);
    ref.stop();
    ref.start();
    ref.stop();
    ref.stop();
    ref.stop();
    ref.stop();
  });
});
