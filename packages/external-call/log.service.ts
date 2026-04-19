import { inject } from 'static-injector';
import { LogFactoryToken } from './token';

export class LogService {
  #log = inject(LogFactoryToken, { optional: true });
  getToken(value: string) {
    return this.#log?.(value);
  }
}
