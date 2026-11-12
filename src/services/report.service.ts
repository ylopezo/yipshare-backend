import {db} from "@/db/db.ts";
import {loans, reportEvidences, reports} from "@/db/schema.ts";
import {and, desc, eq, ne, or, sql} from "drizzle-orm";
import {ForbiddenError, NotFoundError} from "@/utils/errors";
import * as z from "zod";
import {CreateReportRequest} from "@/schema/report.schema.ts";

type CreateReportData = z.infer<typeof CreateReportRequest>;

export const createReport = async (authorId: string, {loanId, text, image}: CreateReportData) => {
    const [loan] = await db.select().from(loans).where(eq(loans.loanId, loanId)).limit(1);
    if (!loan) throw new NotFoundError("Loan not found");
    if (loan.lenderId !== authorId && loan.userId !== authorId)
        throw new ForbiddenError("Not part of this loan");

    return db.transaction(async (tx) => {
        const [report] = await tx.insert(reports).values({loanId, authorId, reportText: text}).returning();
        if (image) await tx.insert(reportEvidences).values({reportId: report!.reportId, image}).returning();
        return report;
    });

}

export const getReportsAboutLoan = async (userId: string) => db.select({
    text: reports.reportText,
    resolved: sql<boolean> `${reports.resolvedAt} IS NOT NULL`,
})
.from (reports)
.innerJoin(loans, eq(loans.loanId, reports.loanId))
.where(and(ne(reports.authorId, userId), or(eq(loans.userId, userId), eq(loans.lenderId, userId))))
.orderBy(desc(reports.reportId));