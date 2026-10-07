import type { EntryProperties } from "@flowscripter/pluggable-io-framework-api";

/** Builds entry properties from a response's headers. */
export function responseToProperties(response: Response): EntryProperties {
  const length = response.headers.get("content-length");
  const lastModified = response.headers.get("last-modified");
  const etag = response.headers.get("etag");
  return {
    size: length === null ? undefined : Number(length),
    lastModified: lastModified === null ? undefined : new Date(lastModified),
    isContainer: false,
    contentType: response.headers.get("content-type") ?? undefined,
    properties: etag === null ? {} : { etag },
  };
}
