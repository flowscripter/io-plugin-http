import { describe, expect, test } from "bun:test";
import { createHttpLocationSchema } from "../../src/schema/httpLocationSchema.ts";

describe("createHttpLocationSchema", () => {
  test("requires a url of its own protocol", () => {
    const schema = createHttpLocationSchema("http");
    expect(schema.safeParse({ url: "HTTP://host/a" }).success).toBe(true);
    expect(schema.safeParse({ url: "https://host/a" }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  test("has the same top-level fields for both protocols", () => {
    expect(Object.keys(createHttpLocationSchema("http").shape).sort()).toEqual(
      Object.keys(createHttpLocationSchema("https").shape).sort(),
    );
  });
});
