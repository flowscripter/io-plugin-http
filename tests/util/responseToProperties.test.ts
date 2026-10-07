import { describe, expect, test } from "bun:test";
import { responseToProperties } from "../../src/util/responseToProperties.ts";

describe("responseToProperties", () => {
  test("reads size, lastModified, contentType and etag", () => {
    const properties = responseToProperties(
      new Response(null, {
        headers: {
          "content-length": "12",
          "last-modified": new Date(1000).toUTCString(),
          "content-type": "text/plain",
          etag: '"e"',
        },
      }),
    );
    expect(properties).toEqual({
      size: 12,
      lastModified: new Date(1000),
      isContainer: false,
      contentType: "text/plain",
      properties: { etag: '"e"' },
    });
  });

  test("leaves missing headers undefined", () => {
    expect(responseToProperties(new Response(null))).toEqual({
      size: undefined,
      lastModified: undefined,
      isContainer: false,
      contentType: undefined,
      properties: {},
    });
  });
});
