import { z } from "zod";

/** A request header sent with every request. */
export const httpHeaderSchema = z.object({ name: z.string(), value: z.string() });

/**
 * Provider config: everything a location carries apart from its `url`.
 * `method` is used for writes and defaults to `PUT`.
 */
export const httpConfigSchema = z.object({
  method: z.enum(["PUT", "POST"]).optional(),
  username: z.string().optional(),
  password: z.string().optional().meta({ secret: true }),
  bearerToken: z.string().optional().meta({ secret: true }),
  headers: z.array(httpHeaderSchema).optional(),
});

export type HttpConfig = z.infer<typeof httpConfigSchema>;
