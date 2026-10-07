import { describe, expect, test } from "bun:test";
import { type Item, PayloadKind, TransientIOError } from "@flowscripter/pluggable-io-framework-api";
import { createWritableHandle } from "../../src/stream/createWritableHandle.ts";

describe("createWritableHandle", () => {
  test("streams items as the request body with the given method", async () => {
    let received = "";
    let method = "";
    const handle = createWritableHandle(
      async (_url, init) => {
        method = init?.method ?? "";
        received = await new Response(init?.body as ReadableStream).text();
        return new Response(null, { status: 204 });
      },
      "http://example.test/a",
      "POST",
      new Headers(),
    );
    const writer = (handle.stream as WritableStream<Item<PayloadKind.Js>>).getWriter();
    await writer.write({ payload: { kind: PayloadKind.Js, data: new TextEncoder().encode("ab") } });
    await writer.close();
    expect(method).toBe("POST");
    expect(received).toBe("ab");
  });

  test("a network failure is transient", async () => {
    const handle = createWritableHandle(
      async () => {
        throw new TypeError("connection reset");
      },
      "http://example.test/a",
      "PUT",
      new Headers(),
    );
    const writer = (handle.stream as WritableStream<Item<PayloadKind.Js>>).getWriter();
    await expect(writer.close()).rejects.toBeInstanceOf(TransientIOError);
  });
});
