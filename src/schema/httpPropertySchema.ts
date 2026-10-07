import { z } from "zod";

/** Provider-specific entry properties reported in `EntryProperties.properties`. */
export const httpPropertySchema = z.object({ etag: z.string().optional() });
