import { describe, expect, test } from "bun:test";
import { httpSettablePropertySchema } from "../../src/schema/httpSettablePropertySchema.ts";

describe("httpSettablePropertySchema", () => {
  test("declares no settable properties", () => {
    expect(Object.keys(httpSettablePropertySchema.shape)).toEqual([]);
  });
});
