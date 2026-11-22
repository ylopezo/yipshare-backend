import {db} from "@/db/db.ts";
import {articles, loans, reportEvidences, reports, users} from "@/db/schema.ts";
import {alias} from "drizzle-orm/pg-core";
import {and, desc, eq, ne, or, sql} from "drizzle-orm";
import {ConflictError,ForbiddenError, NotFoundError} from "@/utils/errors";
import * as z from "zod";
import {CreateReportRequest, UpdateReportStateRequest} from "@/schema/reports.schema.ts";


type CreateReportData = z.infer<typeof CreateReportRequest>;

export const createReport = async (authorId: string, {loanId, text}: CreateReportData, images: string[]) => {
    const [loan] = await db.select().from(loans).where(eq(loans.loanId, loanId)).limit(1);
    if (!loan) throw new NotFoundError("Loan not found");
    if (loan.lenderId !== authorId && loan.userId !== authorId)
        throw new ForbiddenError("Not part of this loan");
    if (loan.state === 'pending' || loan.state === 'rejected')
        throw new ForbiddenError("Loan has not been accepted yet");

    const [existingReport] = await db
        .select({id: reports.reportId})
        .from(reports)
        .where(and(eq(reports.authorId, authorId), eq(reports.loanId, loanId)))
        .limit(1);
    if (existingReport) throw new ConflictError("You have already reported this loan");

    return db.transaction(async (tx) => {
        const [report] = await tx.insert(reports).values({loanId, authorId, reportText: text}).returning();
        if (images.length) await tx.insert(reportEvidences).values(images.map(image => ({reportId: report!.reportId, image})));
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

const author = alias(users, 'author');
const reported = alias(users, 'reported');

export const getCondominiumReports = async (condominiumId: string) => db
    .select({
        id: reports.reportId,
        reportedBy: author.username,
        reported: reported.username,
        text: reports.reportText,
        state: reports.state,
    })
    .from(reports)
    .innerJoin(loans, eq(loans.loanId, reports.loanId))
    .innerJoin(articles, eq(articles.articleId, loans.articleId))
    .innerJoin(author, eq(author.userId, reports.authorId))
    .innerJoin(reported, eq(reported.userId,
        sql`CASE WHEN ${loans.lenderId} = ${reports.authorId} THEN ${loans.userId} ELSE ${loans.lenderId} END`))
    .where(eq(articles.condominiumId, condominiumId))
    .orderBy(desc(reports.reportId));

type ReportState = z.infer<typeof UpdateReportStateRequest>['state'];

export const updateReportState = async (condominiumId: string, reportId: string, state: ReportState, adminId: string) => {
    const [found] = await db
        .select({id: reports.reportId})
        .from(reports)
        .innerJoin(loans, eq(loans.loanId, reports.loanId))
        .innerJoin(articles, eq(articles.articleId, loans.articleId))
        .where(and(eq(reports.reportId, reportId), eq(articles.condominiumId, condominiumId)))
        .limit(1);
    if (!found) throw new NotFoundError("Report not found");

    const resolved = state === 'resolved';
    const [report] = await db
        .update(reports)
        .set({state, resolvedAt: resolved ? new Date() : null, resolvedBy: resolved ? adminId : null})
        .where(eq(reports.reportId, reportId))
        .returning();
    return report;
}
