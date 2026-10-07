import { describe, expect, test } from "bun:test";
import { parseHttpLocationString } from "../../src/location/parseHttpLocationString.ts";

describe("parseHttpLocationString", () => {
  test("keeps the full URL", () => {
    expect(parseHttpLocationString("https://host/a?b=1")).toEqual({ url: "https://host/a?b=1" });
  });
});
