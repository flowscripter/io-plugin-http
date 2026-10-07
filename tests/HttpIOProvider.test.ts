import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  type Item,
  PayloadKind,
  PermanentIOError,
  TransientIOError,
} from "@flowscripter/pluggable-io-framework-api";
import { HttpIOProvider } from "../src/HttpIOProvider.ts";
import { startTestServer, type TestServer } from "./fixtures/testServer.ts";

let server: TestServer;

beforeEach(() => {
  server = startTestServer();
});

afterEach(async () => {
  await server.stop();
});

async function text(stream: ReadableStream<Item<PayloadKind.Js>>): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.payload.data);
  }
  return Buffer.concat(chunks).toString();
}

function item(value: string): Item<PayloadKind.Js> {
  return { payload: { kind: PayloadKind.Js, data: new TextEncoder().encode(value) } };
}

describe("HttpIOProvider", () => {
  test("getProperties reports HEAD response headers", async () => {
    server.files.set("/a.txt", "hello");
    const properties = await new HttpIOProvider({}).getProperties(`${server.url}/a.txt`);
    expect(properties.contentType).toBe("text/plain");
    expect(properties.lastModified?.getTime()).toBe(0);
    expect(properties.isContainer).toBe(false);
    expect(properties.properties).toEqual({ etag: '"v1"' });
    expect(server.requests.at(-1)?.method).toBe("HEAD");
  });

  test("reads a whole entry and ranges of it", async () => {
    server.files.set("/a.txt", "0123456789");
    const handle = await new HttpIOProvider({}).getReadableStream(`${server.url}/a.txt`);
    expect(await text(handle.stream as ReadableStream<Item<PayloadKind.Js>>)).toBe("0123456789");
    expect(await text(await handle.readRange(2, 5))).toBe("234");
    expect(server.requests.at(-1)?.headers.get("range")).toBe("bytes=2-4");
    expect(await text(await handle.readRange(8, Number.MAX_SAFE_INTEGER))).toBe("89");
    expect(server.requests.at(-1)?.headers.get("range")).toBe("bytes=8-");
    expect(await text(await handle.readRange(5, 5))).toBe("");
    expect(await text(await handle.readRange(20, 30))).toBe("");
  });

  test("trims the response when the server ignores Range", async () => {
    server.files.set("/a.txt", "0123456789");
    server.supportRanges = false;
    const handle = await new HttpIOProvider({}).getReadableStream(`${server.url}/a.txt`);
    expect(await text(await handle.readRange(3, 6))).toBe("345");
  });

  test("a failing ranged read is reported", async () => {
    server.files.set("/a.txt", "0123456789");
    const handle = await new HttpIOProvider({}).getReadableStream(`${server.url}/a.txt`);
    server.failNext(503);
    await expect(handle.readRange(0, 2)).rejects.toBeInstanceOf(TransientIOError);
  });

  test("writes with PUT by default and POST when configured", async () => {
    const put = await new HttpIOProvider({}).getWritableStream(`${server.url}/put.txt`);
    const putWriter = (put.stream as WritableStream<Item<PayloadKind.Js>>).getWriter();
    await putWriter.write(item("hello "));
    await putWriter.write(item("world"));
    await putWriter.close();
    expect(server.files.get("/put.txt")).toBe("hello world");
    expect(server.requests.at(-1)?.method).toBe("PUT");

    const post = await new HttpIOProvider({ method: "POST" }).getWritableStream(
      `${server.url}/post.txt`,
    );
    const postWriter = (post.stream as WritableStream<Item<PayloadKind.Js>>).getWriter();
    await postWriter.write(item("posted"));
    await postWriter.close();
    expect(server.requests.at(-1)?.method).toBe("POST");
    expect(server.files.get("/post.txt")).toBe("posted");
  });

  test("a rejected write fails on close", async () => {
    server.failNext(403);
    const handle = await new HttpIOProvider({}).getWritableStream(`${server.url}/a.txt`);
    const writer = (handle.stream as WritableStream<Item<PayloadKind.Js>>).getWriter();
    await writer.write(item("x")).catch(() => {});
    await expect(writer.close()).rejects.toBeInstanceOf(PermanentIOError);
  });

  test("aborting a write cancels the request", async () => {
    const handle = await new HttpIOProvider({}).getWritableStream(`${server.url}/a.txt`);
    const writer = (handle.stream as WritableStream<Item<PayloadKind.Js>>).getWriter();
    await writer.abort(new Error("stop"));
    expect(server.files.has("/a.txt")).toBe(false);
  });

  test("delete sends DELETE", async () => {
    server.files.set("/a.txt", "x");
    await new HttpIOProvider({}).delete(`${server.url}/a.txt`);
    expect(server.files.has("/a.txt")).toBe(false);
  });

  test("sends configured headers and authorization", async () => {
    server.files.set("/a.txt", "x");
    await new HttpIOProvider({
      headers: [{ name: "X-Trace", value: "t1" }],
      bearerToken: "token",
    }).getProperties(`${server.url}/a.txt`);
    expect(server.requests.at(-1)?.headers.get("x-trace")).toBe("t1");
    expect(server.requests.at(-1)?.headers.get("authorization")).toBe("Bearer token");
  });

  test("classifies failures as permanent or transient", async () => {
    const provider = new HttpIOProvider({});
    await expect(provider.getProperties(`${server.url}/missing`)).rejects.toBeInstanceOf(
      PermanentIOError,
    );
    await expect(provider.getReadableStream(`${server.url}/missing`)).rejects.toBeInstanceOf(
      PermanentIOError,
    );
    server.files.set("/a.txt", "x");
    server.failNext(503);
    await expect(provider.delete(`${server.url}/a.txt`)).rejects.toBeInstanceOf(TransientIOError);
    await expect(provider.getProperties("http://127.0.0.1:1/unreachable")).rejects.toBeInstanceOf(
      TransientIOError,
    );
    await expect(
      provider.getReadableStream("http://127.0.0.1:1/unreachable"),
    ).rejects.toBeInstanceOf(TransientIOError);
  });

  test("uses an injected fetch and holds nothing open", async () => {
    const urls: string[] = [];
    const provider = new HttpIOProvider({}, async (url) => {
      urls.push(url);
      return new Response(null, { status: 200, headers: { "content-length": "3" } });
    });
    expect((await provider.getProperties("http://example.test/a")).size).toBe(3);
    expect(urls).toEqual(["http://example.test/a"]);
    await provider[Symbol.asyncDispose]();
  });

  test("omits the members HTTP cannot support", () => {
    const provider = new HttpIOProvider({});
    expect("list" in provider).toBe(false);
    expect("createContainer" in provider).toBe(false);
    expect("setProperties" in provider).toBe(false);
    expect("getMultipartWriter" in provider).toBe(false);
  });
});
