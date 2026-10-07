import {
  type EntryProperties,
  type IOProvider,
  PayloadKind,
  type RangeReadable,
  type StreamHandle,
} from "@flowscripter/pluggable-io-framework-api";
import type { HttpConfig } from "./schema/httpConfigSchema.ts";
import { createReadableHandle } from "./stream/createReadableHandle.ts";
import { createWritableHandle } from "./stream/createWritableHandle.ts";
import { requestHeaders } from "./util/requestHeaders.ts";
import { responseToProperties } from "./util/responseToProperties.ts";
import { networkError, responseError } from "./util/toIOError.ts";

export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * HTTP/HTTPS source/sink provider. Every key is a full URL addressing one
 * entry: reads are `GET` (ranged reads use a `Range` header), writes stream
 * the body of a `PUT` or `POST`, properties come from `HEAD`, and `delete` is
 * `DELETE`. There is no generic way to list, create containers, set
 * properties or upload in parts over HTTP, so those members are omitted.
 */
export class HttpIOProvider implements IOProvider<PayloadKind.Js> {
  public readonly kind = PayloadKind.Js;
  readonly #config: HttpConfig;
  readonly #fetch: Fetch;

  public constructor(config: HttpConfig, fetchFn: Fetch = fetch) {
    this.#config = config;
    this.#fetch = fetchFn;
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    // Each request is independent - nothing is held open between calls.
  }

  public async getProperties(url: string): Promise<EntryProperties> {
    const response = await this.#request("HEAD", url);
    return responseToProperties(response);
  }

  public async delete(url: string): Promise<void> {
    const response = await this.#request("DELETE", url);
    await response.body?.cancel();
  }

  public getReadableStream(
    url: string,
  ): Promise<StreamHandle<PayloadKind.Js> & RangeReadable<PayloadKind.Js>> {
    return createReadableHandle(this.#fetch, url, requestHeaders(this.#config));
  }

  public async getWritableStream(url: string): Promise<StreamHandle<PayloadKind.Js>> {
    return createWritableHandle(
      this.#fetch,
      url,
      this.#config.method ?? "PUT",
      requestHeaders(this.#config),
    );
  }

  async #request(method: "HEAD" | "DELETE", url: string): Promise<Response> {
    let response: Response;
    try {
      response = await this.#fetch(url, { method, headers: requestHeaders(this.#config) });
    } catch (error) {
      throw networkError(error, `${method} ${url}`);
    }
    if (!response.ok) {
      throw responseError(response, `${method} ${url}`);
    }
    return response;
  }
}
