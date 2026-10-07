import { describe, expect, test } from "bun:test";
import { httpPropertySchema } from "../../src/schema/httpPropertySchema.ts";

describe("httpPropertySchema", () => {
  test("accepts an etag", () => {
    expect(httpPropertySchema.parse({ etag: '"v1"' })).toEqual({ etag: '"v1"' });
  });
});
