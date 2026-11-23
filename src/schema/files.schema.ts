import { z } from "zod";

export const FileRequestParams = z.object({
  id: z
    .string()
    .regex(
      /^[0-9a-f]{32}$/,
      "Must be a valid 32-character lowercase hex string",
    ),
});
