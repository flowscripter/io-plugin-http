import {
  type Item,
  PayloadKind,
  type StreamHandle,
} from "@flowscripter/pluggable-io-framework-api";
import { networkError, responseError } from "../util/toIOError.ts";

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Opens a writable handle that streams items as the body of one `PUT` or
 * `POST` request. Closing the handle completes the request and fails if the
 * server rejects it; aborting cancels the request.
 */
export function createWritableHandle(
  fetchFn: Fetch,
  url: string,
  method: "PUT" | "POST",
  headers: Headers,
): StreamHandle<PayloadKind.Js> {
  const body = new TransformStream<Uint8Array, Uint8Array>();
  const writer = body.writable.getWriter();
  const controller = new AbortController();
  const action = `${method} ${url}`;
  const request = fetchFn(url, {
    method,
    headers,
    body: body.readable,
    signal: controller.signal,
    duplex: "half",
  } as RequestInit).then(
    async (response) => {
      if (!response.ok) {
        throw responseError(response, action);
      }
      await response.body?.cancel();
    },
    (error: unknown) => {
      throw networkError(error, action);
    },
  );
  // Rejections are reported by close() or the next write().
  request.catch(() => {});

  return {
    kind: PayloadKind.Js,
    stream: new WritableStream<Item<PayloadKind.Js>>({
      async write(item) {
        await Promise.race([writer.write(item.payload.data), request.then(() => {})]);
      },
      async close() {
        await writer.close();
        await request;
      },
      async abort(reason) {
        controller.abort(reason);
        await writer.abort(reason).catch(() => {});
      },
    }),
  };
}
