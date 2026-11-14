import * as z from 'zod';

export const CreateReportRequest = z.object({
    loanId: z.uuid(),
    text: z.string().trim().min(1, "Report text is required").max(500),
    image: z.url().optional(),

});
export const ReportParams = z.object({
    id: z.uuid(),
    reportId: z.uuid(),
});

export const UpdateReportStateRequest = z.strictObject({
    state: z.enum(['pending', 'in_review', 'resolved']),
});
