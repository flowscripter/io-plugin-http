import { describe, expect, test } from "bun:test";
import { sliceBytes } from "../../src/util/sliceBytes.ts";

async function collect(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

function chunks(...parts: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const part of parts) controller.enqueue(new TextEncoder().encode(part));
      controller.close();
    },
  });
}

describe("sliceBytes", () => {
  test("keeps only the requested range across chunk boundaries", async () => {
    expect(await collect(sliceBytes(chunks("012", "345", "678"), 2, 7))).toBe("23456");
  });

  test("handles a range past the end and an open end", async () => {
    expect(await collect(sliceBytes(chunks("0123"), 10, 20))).toBe("");
    expect(await collect(sliceBytes(chunks("0123"), 1, Number.MAX_SAFE_INTEGER))).toBe("123");
  });
});
