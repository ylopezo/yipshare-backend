import {db} from "@/db/db.ts";
import {z} from "zod";
import type {LoanRequest} from "@/schema/loans.schema.ts";
import {loans} from "@/db/schema.ts";
import {BadRequestError, ConflictError, NotFoundError} from "@/utils/errors";
import {and, eq, or, gt} from "drizzle-orm";
import {generateVerificationCodeUtil, normalizeCode} from "@/utils/verificaton_code.util.ts";
import crypto from "node:crypto";

const safeLoanFields = {
    loanId: loans.loanId,
    lenderId: loans.lenderId,
    userId: loans.userId,
    articleId: loans.articleId,
    requestTextId: loans.requestText,
    state: loans.state,
}

export const createLoanService = async (data: z.infer<typeof LoanRequest>) => {
    const [loan] = await db.insert(loans).values({
        ...data
    }).returning(safeLoanFields);

    if (!loan) throw new ConflictError('Failed to create the loan')

    return loan;
};

export const getAllLoansService = async () => {
    return await db.select(safeLoanFields).from(loans);
};

export const getAllLoansFromLenderService = async (lenderId: string) => {
    return await db.select(safeLoanFields).from(loans).where(eq(loans.lenderId, lenderId));
};

export const getAllLoansFromUserService = async (userId: string) => {
    return await db.select(safeLoanFields).from(loans).where(eq(loans.userId, userId));
};

export const getLoanFromIdService = async (loanId: string) => {
    const [loan] = await db.select(safeLoanFields).from(loans).where(eq(loans.loanId, loanId));
    if (!loan) throw new NotFoundError('Loan not found.');
    return loan;
}


export const getLoanFromIdSelfService = async (userId: string, loanId: string) => {
    const [loan] = await db.select(safeLoanFields).from(loans).where(and(eq(loans.loanId, loanId), or(eq(loans.userId, userId), eq(loans.lenderId, userId))));
    if (!loan) throw new NotFoundError('Loan not found.');
    return loan;
}

type AllowedStartState = 'accepted' | 'pending';
type AllowedEndState = 'accepted' | 'returned';

const VALID_TRANSITIONS: Record<AllowedStartState, AllowedEndState> = {
    pending: 'accepted',
    accepted: 'returned',
};

export const generateVerificationCodeService = async (userId: string, loanId: string) => {
    const [loanCheck] = await db.select().from(loans).where(and(eq(loans.userId, userId), eq(loans.loanId, loanId)))

    if (!loanCheck) throw new NotFoundError('Loan not found.');
    if (loanCheck.state === 'returned') throw new ConflictError('Loan is already returned.');

    const [loan] = await db
        .update(loans)
        .set({
            confirmationCode: generateVerificationCodeUtil(),
            confirmationCodeExpiry: new Date(Date.now() + 15 * 60 * 1000)
        }).where(
            and(
                eq(loans.userId, userId),
                eq(loans.loanId, loanId),
            )).returning();

    if (!loan) {
        throw new ConflictError('Failed to generate verification code. Please try again.');
    }
    return {code: loan.confirmationCode};
}

export const stateChangeLoanService = async (userId: string, loanId: string, expectedStartState: AllowedStartState, endState: AllowedEndState, verificationCode: string) => {
    const [loanCheck] = await db.select().from(loans).where(and(eq(loans.userId, userId), eq(loans.loanId, loanId)))

    if (!loanCheck) throw new NotFoundError('Loan not found.');

    if (loanCheck.state !== expectedStartState) {
        throw new ConflictError(`Loan is not in state ${expectedStartState}`);
    }

    if (VALID_TRANSITIONS[expectedStartState] !== endState) {
        throw new BadRequestError(`Invalid transition from ${expectedStartState} to ${endState}.`);
    }

    if (!loanCheck.confirmationCode) {
        throw new BadRequestError('Invalid or expired confirmation code.');
    }

    if (!loanCheck.confirmationCodeExpiry || new Date() > loanCheck.confirmationCodeExpiry) {
        throw new BadRequestError('Invalid or expired confirmation code.');
    }

    if (!isCodeMatch(loanCheck.confirmationCode, verificationCode)) {
        throw new BadRequestError('Invalid or expired confirmation code.');
    }

    const [loan] = await db
        .update(loans)
        .set({
            state: endState,
            confirmationCode: null,
            confirmationCodeExpiry: null,
            ...(endState === 'accepted' && { confirmationTime: new Date() }),
            ...(endState === 'returned' && { returnTime: new Date() }),
        }).where(
            and(
                eq(loans.userId, userId),
                eq(loans.loanId, loanId),
                eq(loans.state, expectedStartState),
                eq(loans.confirmationCode, loanCheck.confirmationCode),
                gt(loans.confirmationCodeExpiry, new Date())
            )).returning(safeLoanFields);

    if (!loan) {
        throw new ConflictError('Loan state changed or confirmation code expired. Please try again.');
    }
    return loan;
}

function isCodeMatch(storedCode: string, userInput: string): boolean {
    const normalized = normalizeCode(userInput);

    const a = Buffer.from(storedCode, 'utf8');
    const b = Buffer.from(normalized, 'utf8');

    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}