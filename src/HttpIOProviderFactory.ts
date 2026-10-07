import { type IOProviderFactory, PayloadKind } from "@flowscripter/pluggable-io-framework-api";
import { HttpIOProvider } from "./HttpIOProvider.ts";
import { parseHttpLocationString } from "./location/parseHttpLocationString.ts";
import { toHttpProviderInputs } from "./location/toHttpProviderInputs.ts";
import { type HttpConfig, httpConfigSchema } from "./schema/httpConfigSchema.ts";
import { createHttpLocationSchema, type HttpLocation } from "./schema/httpLocationSchema.ts";
import { httpPropertySchema } from "./schema/httpPropertySchema.ts";
import { httpSettablePropertySchema } from "./schema/httpSettablePropertySchema.ts";

/** Creates the factory for one of the two protocols; both share one implementation. */
export function createHttpIOProviderFactory(
  protocol: "http" | "https",
): IOProviderFactory<HttpConfig, PayloadKind.Js, HttpLocation> {
  return {
    protocol,
    kind: PayloadKind.Js,
    configSchema: httpConfigSchema,
    locationSchema: createHttpLocationSchema(protocol),
    propertySchema: httpPropertySchema,
    settablePropertySchema: httpSettablePropertySchema,
    parseLocationString: parseHttpLocationString,
    toProviderInputs: toHttpProviderInputs,
    async createProvider(config) {
      return new HttpIOProvider(config);
    },
  };
}

export const httpIOProviderFactory = createHttpIOProviderFactory("http");
export const httpsIOProviderFactory = createHttpIOProviderFactory("https");
