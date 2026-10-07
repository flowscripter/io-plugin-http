import { z } from "zod";

/** HTTP has no generic way to change entry properties, so nothing is settable. */
export const httpSettablePropertySchema = z.object({});
