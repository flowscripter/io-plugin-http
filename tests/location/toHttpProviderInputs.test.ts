import { describe, expect, test } from "bun:test";
import { toHttpProviderInputs } from "../../src/location/toHttpProviderInputs.ts";

describe("toHttpProviderInputs", () => {
  test("always gives an entry target keyed by the URL, with the rest as config", () => {
    expect(toHttpProviderInputs({ url: "http://host/a", username: "u", password: "p" })).toEqual({
      config: { username: "u", password: "p" },
      target: { kind: "entry", key: "http://host/a" },
    });
  });
});
