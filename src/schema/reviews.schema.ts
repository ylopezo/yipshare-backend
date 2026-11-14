import * as z from "zod";

export const CreateReviewRequest = z.object({
    loanId: z.uuid(),
    stars: z.int().min(1).max(5),
    comment: z.string().trim().max(500).default(''),
});