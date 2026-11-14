import {z} from "zod";

export const ArticleRequest = z.object({
    name: z.string().trim().min(1, "Name is required"),
    description: z.string().trim().min(10, "Description is required"),
    category: z.string().trim().min(1),
    state: z.enum(["excellent", "good", "medium", "bad"]),
    maximumLendTime: z.int().min(1).max(30),
});

export const ArticleParams = z.object({
    id: z.uuid(),
    articleId: z.uuid(),
});

export const ArticleQuery = z.object({
   q: z.string().trim().default('') ,
});