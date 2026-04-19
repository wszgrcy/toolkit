export async function fromAsync<T>(arrayA: AsyncIterator<T, any, unknown>) {
  const list: T[] = [];
  let result = await arrayA.next();
  while (!result.done) {
    list.push(result.value);
    result = await arrayA.next();
  }
  return list;
}
