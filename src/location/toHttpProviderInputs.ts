import type { LocationTarget } from "@flowscripter/pluggable-io-framework-api";
import type { HttpConfig } from "../schema/httpConfigSchema.ts";
import type { HttpLocation } from "../schema/httpLocationSchema.ts";

/**
 * Splits a validated location into the request options and an `entry`
 * target keyed by the URL. HTTP has no containers or patterns.
 */
export function toHttpProviderInputs(location: HttpLocation): {
  config: HttpConfig;
  target: LocationTarget;
} {
  const { url, ...config } = location;
  return { config, target: { kind: "entry", key: url } };
}
