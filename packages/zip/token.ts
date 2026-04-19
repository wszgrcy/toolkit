import { InjectionToken } from 'static-injector';
export interface ZipConfig {
  _7zipExePath?: string;
}
export const ZipConfigToken = new InjectionToken<ZipConfig>('ZipConfig');
