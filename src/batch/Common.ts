export type BatchStreamReader = {
  createStream: (
    byteLen: number,
    isLastInBatch: boolean,
  ) => Promise<ReadableStream<Uint8Array>>;
};

export function createBatchStreamReader(
  head: boolean,
  body: unknown,
): BatchStreamReader {
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  if (!head && body instanceof ReadableStream) {
    reader = body.getReader();
  }

  let leftover: Uint8Array | null = null;

  const makeEmptyStream = () =>
    new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.close();
      },
    });

  async function readExactly(len: number): Promise<Uint8Array> {
    if (!reader) throw new Error("Reader is not available");
    const parts: Uint8Array[] = [];
    let filled = 0;

    if (leftover) {
      const take = Math.min(leftover.length, len);
      parts.push(leftover.subarray(0, take));
      filled += take;
      leftover = leftover.length > take ? leftover.subarray(take) : null;
    }

    while (filled < len) {
      const { value, done } = await reader.read();
      if (done) throw new Error("Unexpected EOF while batching records");

      const need = len - filled;
      if (value.length > need) {
        parts.push(value.subarray(0, need));
        leftover = value.subarray(need);
        filled = len;
      } else {
        parts.push(value);
        filled += value.length;
      }
    }

    const out = new Uint8Array(len);
    let off = 0;
    for (const p of parts) {
      out.set(p, off);
      off += p.length;
    }
    return out;
  }

  async function createStream(
    byteLen: number,
    isLastInBatch: boolean,
  ): Promise<ReadableStream<Uint8Array>> {
    if (!reader) {
      return makeEmptyStream();
    }

    if (isLastInBatch) {
      // Last record in batch must be streamed because it can be very large.
      return new ReadableStream<Uint8Array>({
        start(ctrl) {
          if (leftover) {
            ctrl.enqueue(leftover);
          }
        },

        async pull(ctrl) {
          if (!reader) {
            throw new Error("Reader is not available");
          }

          const { value, done: isDone } = await reader.read();
          if (value) {
            ctrl.enqueue(value);
          }

          if (isDone) {
            ctrl.close();
          }
        },
      });
    }

    const bytes = await readExactly(byteLen);
    return new ReadableStream<Uint8Array>({
      start(ctrl) {
        if (bytes.length) ctrl.enqueue(bytes);
        ctrl.close();
      },
    });
  }

  return { createStream };
}
