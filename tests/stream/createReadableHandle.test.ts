import { describe, expect, test } from "bun:test";
import { isRangeReadable, PermanentIOError } from "@flowscripter/pluggable-io-framework-api";
import { createReadableHandle } from "../../src/stream/createReadableHandle.ts";

describe("createReadableHandle", () => {
  test("is RangeReadable and fails for an unsuccessful GET", async () => {
    const ok = await createReadableHandle(
      async () => new Response("abc"),
      "http://example.test/a",
      new Headers(),
    );
    expect(isRangeReadable(ok)).toBe(true);
    await expect(
      createReadableHandle(
        async () => new Response(null, { status: 404 }),
        "http://example.test/a",
        new Headers(),
      ),
    ).rejects.toBeInstanceOf(PermanentIOError);
  });

  test("does not change the caller's headers for a ranged read", async () => {
    const headers = new Headers({ "x-a": "1" });
    const seen: (string | null)[] = [];
    const handle = await createReadableHandle(
      async (_url, init) => {
        seen.push(new Headers(init?.headers).get("range"));
        return new Response("abc", { status: 206 });
      },
      "http://example.test/a",
      headers,
    );
    await handle.readRange(0, 2);
    expect(seen).toEqual([null, "bytes=0-1"]);
    expect(headers.has("range")).toBe(false);
  });
});
