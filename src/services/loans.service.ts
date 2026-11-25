import {db} from "@/db/db.ts";
import {z} from "zod";
import type {LoanRequest} from "@/schema/loans.schema.ts";
import {articles, condominiumMembers, loans, notifications, userRoles, users} from "@/db/schema.ts";
import {ConflictError, ForbiddenError, NotFoundError} from "@/utils/errors";
import {and, desc, eq, gt, isNull, ne, or, sql} from "drizzle-orm";
import {alias} from "drizzle-orm/pg-core";
import {generateVerificationCodeUtil, normalizeCode} from "@/utils/verificaton_code.util.ts";
import {canRequestLoans} from "@/services/condominiums.service.ts";
import crypto from "node:crypto";

const CODE_LENGTH = 6;
const CODE_DURATION_MS = 15 * 60 * 1000;

const safeLoanFields = {
    loanId: loans.loanId,
    lenderId: loans.lenderId,
    userId: loans.userId,
    articleId: loans.articleId,
    requestTextId: loans.requestText,
    state: loans.state,
}

const other = alias(users, 'other');

const myLoanFields = (userId: string) => ({
    loanId: loans.loanId,
    state: loans.state,
    requestText: loans.requestText,
    days: loans.days,
    lentByMe: sql<boolean>`${loans.lenderId} = ${userId}`,
    startedAt: loans.confirmationTime,
    dueAt: sql<Date>`coalesce(${loans.confirmationTime}, now()) + ${loans.days} * interval '1 day'`,
    articleId: articles.articleId,
    articleName: articles.name,
    description: articles.description,
    image: articles.image,
    condominiumId: articles.condominiumId,
    otherUserId: other.userId,
    otherUsername: other.username,
    otherPhoneNumber: other.phoneNumber,
    otherRating: other.computedRating,
});

const selectMyLoans = (userId: string) => db
    .select(myLoanFields(userId))
    .from(loans)
    .innerJoin(articles, eq(articles.articleId, loans.articleId))
    .innerJoin(other, eq(other.userId, sql`CASE WHEN ${loans.lenderId} = ${userId} THEN ${loans.userId} ELSE ${loans.lenderId} END`));

export const createLoanService = async (userId: string, {articleId, requestText, days}: z.infer<typeof LoanRequest>) => {
    const [article] = await db.select().from(articles).where(and(eq(articles.articleId, articleId), isNull(articles.deletedAt))).limit(1);
    if (!article) throw new NotFoundError('Article not found');
    if (article.lendingUser === userId) throw new ConflictError("You can't borrow your own article");
    if (article.availability !== 'available') throw new ConflictError('Article is not available');

    const [member] = await db.select({id: condominiumMembers.userId}).from(condominiumMembers)
        .where(and(eq(condominiumMembers.userId, userId), eq(condominiumMembers.condominiumId, article.condominiumId))).limit(1);
    const [role] = await db.select({id: userRoles.uuid}).from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.condominiumId, article.condominiumId))).limit(1);
    if (!member && !role) throw new ForbiddenError('Not a member of this condominium');
    if (!(await canRequestLoans(userId, article.condominiumId))) throw new ForbiddenError('Loan access revoked');

    const [pending] = await db.select({id: loans.loanId}).from(loans)
        .where(and(eq(loans.userId, userId), eq(loans.articleId, articleId), eq(loans.state, 'pending'))).limit(1);
    if (pending) throw new ConflictError('Request already pending');

    return db.transaction(async (tx) => {
        const [loan] = await tx.insert(loans)
            .values({lenderId: article.lendingUser, userId, articleId, requestText, days})
            .returning(safeLoanFields);
        if (!loan) throw new ConflictError('Failed to create the loan');

        await tx.insert(notifications).values({
            userId: article.lendingUser,
            header: 'Nueva solicitud de préstamo',
            body: `Alguien quiere tu artículo «${article.name}».`,
            action: {type: 'loan_requested', loanId: loan.loanId},
        });
        return loan;
    });
};

export const getAllLoansService = async () => {
    return await db.select(safeLoanFields).from(loans);
};

export const getMyLoansService = async (userId: string, condominiumId?: string) => {
    return selectMyLoans(userId)
        .where(and(
            or(eq(loans.lenderId, userId), eq(loans.userId, userId)),
            notDroppedRequest,
            condominiumId ? eq(articles.condominiumId, condominiumId) : undefined,
        ))
        .orderBy(desc(loans.loanId));
};

export const getMyLentLoansService = async (userId: string, condominiumId?: string) => {
    return selectMyLoans(userId)
        .where(and(
            eq(loans.lenderId, userId),
            isNull(articles.deletedAt),
            condominiumId ? eq(articles.condominiumId, condominiumId) : undefined,
        ))
        .orderBy(desc(loans.loanId));
};

const notDroppedRequest = or(isNull(articles.deletedAt), ne(loans.state, 'rejected'));

const lender = alias(users, 'lender');
const borrower = alias(users, 'borrower');

export const getAllLoansFromCondominium = async (condominiumId: string) => {
    return db.select({
        ...safeLoanFields,
        days: loans.days,
        startedAt: loans.confirmationTime,
        articleName: articles.name,
        lenderUsername: lender.username,
        borrowerUsername: borrower.username,
    })
        .from(loans)
        .innerJoin(articles, eq(loans.articleId, articles.articleId))
        .innerJoin(lender, eq(lender.userId, loans.lenderId))
        .innerJoin(borrower, eq(borrower.userId, loans.userId))
        .where(and(eq(articles.condominiumId, condominiumId), notDroppedRequest))
        .orderBy(desc(loans.loanId));
};

export const getLoanFromIdService = async (loanId: string) => {
    const [loan] = await db.select(safeLoanFields).from(loans).where(eq(loans.loanId, loanId));
    if (!loan) throw new NotFoundError('Loan not found.');
    return loan;
}

export const getLoanFromIdSelfService = async (userId: string, loanId: string) => {
    const [loan] = await selectMyLoans(userId)
        .where(and(eq(loans.loanId, loanId), or(eq(loans.userId, userId), eq(loans.lenderId, userId))));
    if (!loan) throw new NotFoundError('Loan not found.');
    return loan;
}

export const answerLoanRequestService = async (lenderId: string, loanId: string, answer: 'accepted' | 'rejected') => {
    await db.transaction(async (tx) => {
        const [loan] = await tx.update(loans)
            .set({state: answer})
            .where(and(eq(loans.loanId, loanId), eq(loans.lenderId, lenderId), eq(loans.state, 'pending')))
            .returning();
        if (!loan) throw new ConflictError('Loan request is not pending');

        if (answer === 'accepted') {
            await tx.update(articles).set({availability: 'not_available'}).where(eq(articles.articleId, loan.articleId));
        }
        await tx.insert(notifications).values({
            userId: loan.userId,
            header: answer === 'accepted' ? 'Préstamo aceptado' : 'Préstamo rechazado',
            body: answer === 'accepted'
                ? 'Tu solicitud de préstamo fue aceptada. Ponte de acuerdo para recogerlo.'
                : 'Tu solicitud de préstamo fue rechazada.',
            action: {type: answer === 'accepted' ? 'loan_accepted' : 'loan_rejected', loanId},
        });
    });
    return getLoanFromIdSelfService(lenderId, loanId);
}

export const generateVerificationCodeService = async (lenderId: string, loanId: string) => {
    const [loan] = await db
        .update(loans)
        .set({
            confirmationCode: generateVerificationCodeUtil(CODE_LENGTH),
            confirmationCodeExpiry: new Date(Date.now() + CODE_DURATION_MS),
        })
        .where(and(
            eq(loans.lenderId, lenderId),
            eq(loans.loanId, loanId),
            or(eq(loans.state, 'accepted'), eq(loans.state, 'on_loan')),
        ))
        .returning();

    if (!loan) throw new NotFoundError('Loan not found or not active.');
    return {code: loan.confirmationCode};
}

export const confirmCodeService = async (userId: string, loanId: string, verificationCode: string) => {
    const [loanCheck] = await db.select().from(loans).where(and(eq(loans.userId, userId), eq(loans.loanId, loanId)));
    if (!loanCheck) throw new NotFoundError('Loan not found.');
    if (loanCheck.state !== 'accepted' && loanCheck.state !== 'on_loan') throw new ConflictError('Loan is not active');

    if (!loanCheck.confirmationCode
        || !loanCheck.confirmationCodeExpiry
        || new Date() > loanCheck.confirmationCodeExpiry
        || !isCodeMatch(loanCheck.confirmationCode, verificationCode)) {
        throw new ForbiddenError('Invalid or expired confirmation code.');
    }

    const returning = loanCheck.state === 'on_loan';
    await db.transaction(async (tx) => {
        const [loan] = await tx
            .update(loans)
            .set({
                state: returning ? 'returned' : 'on_loan',
                confirmationCode: null,
                confirmationCodeExpiry: null,
                ...(returning ? {returnTime: new Date()} : {confirmationTime: new Date()}),
            }).where(and(
                eq(loans.userId, userId),
                eq(loans.loanId, loanId),
                eq(loans.state, loanCheck.state),
                eq(loans.confirmationCode, loanCheck.confirmationCode!),
                gt(loans.confirmationCodeExpiry, new Date()),
            )).returning();
        if (!loan) throw new ConflictError('Loan state changed or confirmation code expired. Please try again.');

        if (returning) await tx.update(articles).set({availability: 'available'}).where(eq(articles.articleId, loan.articleId));
    });
    return getLoanFromIdSelfService(userId, loanId);
}

function isCodeMatch(storedCode: string, userInput: string): boolean {
    const normalized = normalizeCode(userInput);

    const a = Buffer.from(storedCode, 'utf8');
    const b = Buffer.from(normalized, 'utf8');

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}
