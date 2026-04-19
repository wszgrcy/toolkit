export function isIterable<T = unknown>(obj: any): obj is Iterable<T> {
  return typeof obj?.[Symbol.iterator] === 'function';
}
export function isAsyncIterable(obj: any): obj is AsyncGenerator {
  return typeof obj?.[Symbol.asyncIterator] === 'function';
}
