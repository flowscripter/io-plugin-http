import { z } from "zod";
import { httpConfigSchema } from "./httpConfigSchema.ts";

/**
 * A location for `protocol`: the full `url`, which must use that protocol,
 * plus the request options of {@link httpConfigSchema}.
 */
export function createHttpLocationSchema(protocol: "http" | "https") {
  return httpConfigSchema.extend({
    url: z.string().refine((url) => url.toLowerCase().startsWith(`${protocol}://`), {
      message: `url must start with ${protocol}://`,
    }),
  });
}

export type HttpLocation = z.infer<ReturnType<typeof createHttpLocationSchema>>;
