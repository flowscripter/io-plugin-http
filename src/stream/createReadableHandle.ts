import {
  fromWebReadableStream,
  type Item,
  PayloadKind,
  type RangeReadable,
  type StreamHandle,
} from "@flowscripter/pluggable-io-framework-api";
import { networkError, responseError } from "../util/toIOError.ts";
import { sliceBytes } from "../util/sliceBytes.ts";

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

function emptyStream(): ReadableStream<Item<PayloadKind.Js>> {
  return new ReadableStream({
    start(controller) {
      controller.close();
    },
  });
}

async function get(fetchFn: Fetch, url: string, headers: Headers): Promise<Response> {
  try {
    return await fetchFn(url, { method: "GET", headers });
  } catch (error) {
    throw networkError(error, `GET ${url}`);
  }
}

/**
 * Opens a readable handle for a URL. `readRange(start, end)` (`end`
 * exclusive) sends a fresh `GET` with a `Range` header; a range past the end
 * is an empty stream, and a server that ignores the `Range` header has its
 * response trimmed to the range.
 */
export async function createReadableHandle(
  fetchFn: Fetch,
  url: string,
  headers: Headers,
): Promise<StreamHandle<PayloadKind.Js> & RangeReadable<PayloadKind.Js>> {
  const response = await get(fetchFn, url, headers);
  if (!response.ok || response.body === null) {
    throw responseError(response, `GET ${url}`);
  }
  return {
    kind: PayloadKind.Js,
    stream: fromWebReadableStream(response.body),
    async readRange(start: number, end: number) {
      if (end <= start) {
        return emptyStream();
      }
      const rangeHeaders = new Headers(headers);
      const last = end >= Number.MAX_SAFE_INTEGER ? "" : String(end - 1);
      rangeHeaders.set("Range", `bytes=${start}-${last}`);
      const ranged = await get(fetchFn, url, rangeHeaders);
      if (ranged.status === 416) {
        await ranged.body?.cancel();
        return emptyStream();
      }
      if (!ranged.ok || ranged.body === null) {
        throw responseError(ranged, `GET ${url}`);
      }
      const body = ranged.status === 206 ? ranged.body : sliceBytes(ranged.body, start, end);
      return fromWebReadableStream(body);
    },
  };
}
