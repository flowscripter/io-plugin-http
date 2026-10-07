import type { HttpConfig } from "../schema/httpConfigSchema.ts";

/** The headers every request carries: configured headers plus authorization. */
export function requestHeaders(config: HttpConfig): Headers {
  const headers = new Headers();
  for (const { name, value } of config.headers ?? []) {
    headers.append(name, value);
  }
  if (config.bearerToken !== undefined) {
    headers.set("Authorization", `Bearer ${config.bearerToken}`);
  } else if (config.username !== undefined) {
    const credentials = `${config.username}:${config.password ?? ""}`;
    headers.set("Authorization", `Basic ${Buffer.from(credentials).toString("base64")}`);
  }
  return headers;
}
