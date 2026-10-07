import { describe, expect, test } from "bun:test";
import { PermanentIOError, TransientIOError } from "@flowscripter/pluggable-io-framework-api";
import { networkError, responseError } from "../../src/util/toIOError.ts";

describe("responseError", () => {
  test("timeouts, throttling and server errors are transient; other errors are permanent", () => {
    for (const status of [408, 429, 500, 503]) {
      expect(responseError(new Response(null, { status }), "GET x")).toBeInstanceOf(
        TransientIOError,
      );
    }
    for (const status of [400, 401, 403, 404]) {
      expect(responseError(new Response(null, { status }), "GET x")).toBeInstanceOf(
        PermanentIOError,
      );
    }
    expect(responseError(new Response(null, { status: 404 }), "GET x").message).toBe(
      "GET x failed with HTTP 404",
    );
  });
});

describe("networkError", () => {
  test("wraps unknown failures as transient and keeps classified and abort errors", () => {
    const wrapped = networkError(new TypeError("connection refused"), "GET x");
    expect(wrapped).toBeInstanceOf(TransientIOError);
    expect(wrapped.cause).toBeInstanceOf(TypeError);
    const permanent = new PermanentIOError("p");
    expect(networkError(permanent, "GET x")).toBe(permanent);
    const abort = new DOMException("aborted", "AbortError");
    expect(networkError(abort, "GET x")).toBe(abort);
  });
});
