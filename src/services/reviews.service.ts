import {db} from "@/db/db.ts";
import {loans, reviews, users} from "@/db/schema.ts";
import {and, desc, eq, sql} from "drizzle-orm";
import {ConflictError, ForbiddenError, NotFoundError} from "@/utils/errors";
import * as z from "zod";
import {CondominiumReviewQuery, CreateReviewRequest} from "@/schema/reviews.schema.ts";
import {articles} from "@/db/schema.ts";
import {alias} from "drizzle-orm/pg-core";

type CreateReviewData = z.infer<typeof CreateReviewRequest>;

export const createReview = async (authorId: string, {loanId, stars, comment}: CreateReviewData) => {
    const [loan] = await db.select().from(loans).where(eq(loans.loanId, loanId)).limit(1);

    if (!loan) throw new NotFoundError("Loan not found");

    if (loan.lenderId !== authorId && loan.userId !== authorId)
        throw new ForbiddenError("Not part of this loan")

    if (loan.state !== 'returned')
       throw new ForbiddenError("Loan item has not been returned yet");

    const [existingReview] = await db
        .select({id: reviews.reviewId})
        .from(reviews)
        .where(and(eq(reviews.loanId, loanId), eq(reviews.reviewerId, authorId)))
        .limit(1);
    if (existingReview) throw new ConflictError("You have already reviewed this loan");

    const reviewedId = loan.lenderId === authorId ? loan.userId : loan.lenderId;

    return db.transaction(async (tx) => {
        const [review] = await tx.insert(reviews)
            .values({loanId, reviewerId: authorId, reviewedId, rating: stars, reviewText: comment})
            .returning();
        await tx.update(users)
            .set({computedRating: sql`(SELECT ROUND(AVG(${reviews.rating}) * 10) FROM ${reviews} WHERE ${reviews.reviewedId} = ${reviewedId})`})
            .where(eq(users.userId, reviewedId));
        return review;
    });
};

export const getReceivedReviews = async (userId: string) => db.select({
    loanId : reviews.loanId,
    from: users.username,
    stars : reviews.rating,
    comment: reviews.reviewText
})
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.userId))
    .where(eq(reviews.reviewedId, userId))
    .orderBy(desc(reviews.reviewId));


const reviewer = alias(users, 'reviewer');
const reviewed = alias(users, 'reviewed');

type ReviewsFilter = z.infer<typeof CondominiumReviewQuery>;

export const getCondominiumReviews = async (condominiumId: string, {userId, as}: ReviewsFilter) => db
    .select({
        reviewId: reviews.reviewId,
        loanId: reviews.loanId,
        article: articles.name,
        from: reviewer.username,
        to: reviewed.username,
        as: sql<'lender' | 'borrower'>`CASE WHEN ${reviews.reviewedId} = ${loans.lenderId} THEN 'lender' ELSE 'borrower' END`,
        stars: reviews.rating,
        comment: reviews.reviewText,
    })
    .from(reviews)
    .innerJoin(loans, eq(loans.loanId, reviews.loanId))
    .innerJoin(articles, eq(articles.articleId, loans.articleId))
    .innerJoin(reviewer, eq(reviewer.userId, reviews.reviewerId))
    .innerJoin(reviewed, eq(reviewed.userId, reviews.reviewedId))
    .where(and(
        eq(articles.condominiumId, condominiumId),
        userId ? eq(reviews.reviewedId, userId) : undefined,
        as === 'lender' ? eq(reviews.reviewedId, loans.lenderId) : undefined,
        as === 'borrower' ? eq(reviews.reviewedId, loans.userId) : undefined,
    ))
    .orderBy(desc(reviews.reviewId));
