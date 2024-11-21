
export function* chunks<T>(iter: AsyncGenerator<T>, batchSize: number): Iterable<Iterable<T>> {
  const iterator = iter[Symbol.iterator]()
  let done = false
  while (!done) {
    const batch: T[] = []
    while (batch.length < batchSize) {
      const res = iterator.next()
      if (res.done) {
        done = true
        break
      } else {
        batch.push(res.value)
      }
    }
    if (batch.length > 0) {
      yield batch
    }
  }
}

export async function* lineGenerator(stream: ReadableStream, decoder = new TextDecoder()) {
  const reader = stream.getReader({
    // mode: 'byob',
  })
  const re = /\r?\n/gm;
  let chunk = "";
  let startIndex = 0;
  for (; ;) {
    const result = re.exec(chunk);
    if (result) {
      yield chunk.substring(startIndex, result.index);
      startIndex = re.lastIndex;
    } else {
      chunk = chunk.substring(startIndex);
      startIndex = re.lastIndex = 0;
      // @ts-ignore
      const r = await reader.read();
      if (r.done) {
        break;
      }
      chunk += decoder.decode(r.value);
    }
  }
  if (startIndex < chunk.length) {
    yield chunk;
  }
}

export const lines = (path?: string) => {
  if (!path) {
    // stdin:
    return lineGenerator(Bun.stdin.stream())
  }

  return lineGenerator(Bun.file(path).stream())
}
