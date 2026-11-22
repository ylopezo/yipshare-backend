import { z } from "zod";

export const LoanRequest = z.object({
    articleId: z.uuid(),
    requestText: z.string().trim().max(500),
    days: z.int().min(1).max(30),
});

export const LoanQueryRequest = z.object({
    id: z.uuid(),
});

export const MyLoansQuery = z.object({
    condominiumId: z.uuid().optional(),
});

export const VerificationCodeBody = z.object({
    code: z.string(),
});
