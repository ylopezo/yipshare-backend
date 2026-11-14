import {db} from "@/db/db.ts";
import {loans, reviews, users} from "@/db/schema.ts";
import {and, desc, eq, sql} from "drizzle-orm";
import {ConflictError, ForbiddenError, NotFoundError} from "@/utils/errors";
import * as z from "zod";
import {CreateReviewRequest} from "@/schema/reviews.schema.ts";

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