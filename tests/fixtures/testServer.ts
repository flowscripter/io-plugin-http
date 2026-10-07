export interface RecordedRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: Headers;
  readonly body?: string;
}

export interface TestServer {
  readonly url: string;
  readonly files: Map<string, string>;
  readonly requests: RecordedRequest[];
  /** Status to answer the next request with, instead of handling it. */
  failNext(status: number): void;
  /** Whether `GET` honours `Range` headers. Defaults to `true`. */
  supportRanges: boolean;
  stop(): Promise<void>;
}

/** A local in-memory HTTP server: GET (with Range), HEAD, PUT, POST and DELETE. */
export function startTestServer(): TestServer {
  const files = new Map<string, string>();
  const requests: RecordedRequest[] = [];
  let nextStatus: number | undefined;
  const state = { supportRanges: true };

  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      const body =
        request.method === "PUT" || request.method === "POST" ? await request.text() : undefined;
      requests.push({ method: request.method, path, headers: request.headers, body });
      if (nextStatus !== undefined) {
        const status = nextStatus;
        nextStatus = undefined;
        return new Response(null, { status });
      }
      if (body !== undefined) {
        files.set(path, body);
        return new Response(null, { status: 201 });
      }
      const content = files.get(path);
      if (content === undefined) {
        return new Response(null, { status: 404 });
      }
      if (request.method === "DELETE") {
        files.delete(path);
        return new Response(null, { status: 204 });
      }
      const headers = {
        "content-type": "text/plain",
        "last-modified": new Date(0).toUTCString(),
        etag: '"v1"',
      };
      const range = request.headers.get("range");
      if (request.method === "GET" && range && state.supportRanges) {
        const [, from, to] = /bytes=(\d+)-(\d*)/.exec(range) ?? [];
        const start = Number(from);
        if (start >= content.length) {
          return new Response(null, { status: 416 });
        }
        const end = to === "" ? content.length : Math.min(Number(to) + 1, content.length);
        return new Response(content.slice(start, end), { status: 206, headers });
      }
      return new Response(request.method === "HEAD" ? null : content, {
        headers: { ...headers, "content-length": String(content.length) },
      });
    },
  });

  return {
    url: `http://localhost:${server.port}`,
    files,
    requests,
    failNext(status: number) {
      nextStatus = status;
    },
    get supportRanges() {
      return state.supportRanges;
    },
    set supportRanges(value: boolean) {
      state.supportRanges = value;
    },
    stop: () => server.stop(true),
  };
}
