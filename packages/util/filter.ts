import { pickBy } from 'es-toolkit';
import { isNonNullable } from './is-non-nullable';
type FilterUndefinedNull<T> = {
  [K in keyof T as T[K] extends undefined | null ? never : K]: T[K];
};

export function filterObjectEmptyKey<T extends object>(
  obj: T | undefined,
): FilterUndefinedNull<NonNullable<T>> {
  if (!obj) {
    return {} as any;
  }
  return pickBy(obj, isNonNullable) as any;
}
export function deepFilterObjectEmptyKey<T>(
  obj: T | undefined,
  options?: {
    removeUndefinedArrayItem?: boolean;
  },
): T {
  if (!obj) {
    return {} as any;
  }
  const itemFn = (item: any) => {
    if (isNonNullable(item)) {
      if (typeof item === 'object') {
        return deepFilterObjectEmptyKey(item, options);
      } else {
        return item;
      }
    }
    return undefined;
  };
  if (Array.isArray(obj)) {
    let result = obj.map((item, index) => itemFn(item)) as any[];
    if (options?.removeUndefinedArrayItem) {
      result = result.filter(isNonNullable);
    }
    return result as any;
  } else {
    const tempObj = {} as Record<string, any>;
    for (const key in obj) {
      const item = obj[key];
      const result = itemFn(item);

      if (isNonNullable(result)) {
        tempObj[key] = result;
      }
    }
    return tempObj as any;
  }
}
export function filterListEmptyKey<T extends any[]>(list: T) {
  return list.filter(isNonNullable);
}
