import { z } from "zod";

export const ArticleRequest = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(10, "Description is required and must be atleast 10 characters"),
  category: z.string().trim().min(1),
  state: z.enum(["excellent", "good", "medium", "bad"]),
  maximumLendTime: z.coerce.number().int().min(1).max(30),
  loanDurations: z.preprocess(
    (v) => (v === undefined ? v : [v].flat()),
    z.array(z.coerce.number().int().min(1).max(30)).min(1).optional(),
  ),
});

export const ArticleParams = z.object({
  id: z.uuid(),
  articleId: z.uuid(),
});

export const ArticleQuery = z.object({
   q: z.string().trim().default('') ,
});