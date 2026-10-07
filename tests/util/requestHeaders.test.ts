import { describe, expect, test } from "bun:test";
import { requestHeaders } from "../../src/util/requestHeaders.ts";

describe("requestHeaders", () => {
  test("adds configured headers", () => {
    const headers = requestHeaders({ headers: [{ name: "X-A", value: "1" }] });
    expect(headers.get("x-a")).toBe("1");
    expect(headers.has("authorization")).toBe(false);
  });

  test("uses basic auth for a username, with an empty password by default", () => {
    expect(requestHeaders({ username: "u", password: "p" }).get("authorization")).toBe(
      `Basic ${btoa("u:p")}`,
    );
    expect(requestHeaders({ username: "u" }).get("authorization")).toBe(`Basic ${btoa("u:")}`);
  });

  test("prefers a bearer token", () => {
    expect(requestHeaders({ username: "u", bearerToken: "t" }).get("authorization")).toBe(
      "Bearer t",
    );
  });
});
