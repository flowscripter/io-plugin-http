import { PermanentIOError, TransientIOError } from "@flowscripter/pluggable-io-framework-api";

/**
 * Classifies an unsuccessful response: timeouts, throttling and server
 * errors are worth retrying; other client errors are not.
 */
export function responseError(response: Response, action: string): Error {
  const message = `${action} failed with HTTP ${response.status} ${response.statusText}`.trim();
  if (response.status === 408 || response.status === 429 || response.status >= 500) {
    return new TransientIOError(message);
  }
  return new PermanentIOError(message);
}

/** Network failures (no response at all) are worth retrying. */
export function networkError(error: unknown, action: string): Error {
  if (error instanceof TransientIOError || error instanceof PermanentIOError) {
    return error;
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return error as Error;
  }
  return new TransientIOError(`${action} failed: ${String(error)}`, { cause: error });
}
