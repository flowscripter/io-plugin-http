import { describe, expect, test } from "bun:test";
import { PayloadKind } from "@flowscripter/pluggable-io-framework-api";
import { HttpIOProvider } from "../src/HttpIOProvider.ts";
import {
  createHttpIOProviderFactory,
  httpIOProviderFactory,
  httpsIOProviderFactory,
} from "../src/HttpIOProviderFactory.ts";

const context = {
  resolver: { createProviderForLocation: () => Promise.reject(new Error("not used")) },
};

describe("http and https provider factories", () => {
  test("declare their protocol and the js payload kind", () => {
    expect(httpIOProviderFactory.protocol).toBe("http");
    expect(httpsIOProviderFactory.protocol).toBe("https");
    expect(createHttpIOProviderFactory("https").kind).toBe(PayloadKind.Js);
  });

  test("turn a location string into config and an entry target", () => {
    const location = httpsIOProviderFactory.locationSchema.parse({
      ...(httpsIOProviderFactory.parseLocationString("https://host/a.txt") as object),
      method: "POST",
    });
    expect(httpsIOProviderFactory.toProviderInputs(location)).toEqual({
      config: { method: "POST" },
      target: { kind: "entry", key: "https://host/a.txt" },
    });
  });

  test("reject a url for the other protocol", () => {
    expect(httpIOProviderFactory.locationSchema.safeParse({ url: "https://host/a" }).success).toBe(
      false,
    );
  });

  test("create an HttpIOProvider", async () => {
    const provider = await httpIOProviderFactory.createProvider({}, context);
    expect(provider).toBeInstanceOf(HttpIOProvider);
  });
});
