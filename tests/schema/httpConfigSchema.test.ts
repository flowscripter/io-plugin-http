import { describe, expect, test } from "bun:test";
import { httpConfigSchema, httpHeaderSchema } from "../../src/schema/httpConfigSchema.ts";

describe("httpConfigSchema", () => {
  test("accepts request options and marks credentials as secret", () => {
    expect(httpConfigSchema.parse({ method: "PUT", headers: [{ name: "a", value: "b" }] })).toEqual(
      { method: "PUT", headers: [{ name: "a", value: "b" }] },
    );
    expect(httpConfigSchema.safeParse({ method: "PATCH" }).success).toBe(false);
    expect(httpConfigSchema.shape.password.meta()).toEqual({ secret: true });
    expect(httpConfigSchema.shape.bearerToken.meta()).toEqual({ secret: true });
    expect(httpHeaderSchema.safeParse({ name: "a" }).success).toBe(false);
  });
});
