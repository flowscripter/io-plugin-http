/**
 * Passes through only bytes `start` (inclusive) to `end` (exclusive) of a
 * byte stream, for servers that ignore a `Range` request.
 */
export function sliceBytes(
  stream: ReadableStream<Uint8Array>,
  start: number,
  end: number,
): ReadableStream<Uint8Array> {
  let offset = 0;
  return stream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const chunkStart = offset;
        offset += chunk.byteLength;
        const from = Math.max(start - chunkStart, 0);
        const to = Math.min(end - chunkStart, chunk.byteLength);
        if (to > from) {
          controller.enqueue(chunk.subarray(from, to));
        }
        if (offset >= end) {
          controller.terminate();
        }
      },
    }),
  );
}
