import { isString } from 'es-toolkit';
import { isObject } from 'es-toolkit/compat';
export function isChatSchema(input: any) {
  return (
    input &&
    typeof input === 'object' &&
    isString(input.name) &&
    isObject(input.schema)
  );
}
