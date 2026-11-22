import {z} from "zod";

export const FileRequestParams = z.object({
    id: z.string().regex(/^[0-9a-f]{32}$/, "Invalid file ID"),
});