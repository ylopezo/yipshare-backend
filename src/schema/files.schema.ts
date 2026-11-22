import { z } from "zod";

export const FileRequestParams = z.object({
    id: z.uuid(),
});
