import * as z from 'zod';

export const CreateReportRequest = z.object({
    loanId: z.uuid(),
    text: z.string().trim().min(1, "Report text is required"),
    image: z.url().optional(),

});