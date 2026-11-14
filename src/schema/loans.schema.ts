import {z} from "zod";

export const LoanRequest = z.object({
    lenderId: z.uuid(),
    userId: z.uuid(),
    articleId: z.uuid(),
    requestText: z.string(),
})

export const LoanLenderRequest = z.object({
    id: z.uuid(),
})

export const LoanUserRequest = z.object({
    id: z.uuid(),
})

export const LoanQueryRequest = z.object({
    id: z.uuid(),
})

export const VerificationCodeBody = z.object({
    code: z.string(),
})