import type {Response, NextFunction} from "express";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {CreateReviewRequest} from "@/schema/reviews.schema.ts";
import {createReview, getReceivedReviews} from "@/services/reviews.service.ts";

export const postReview = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const data = CreateReviewRequest.parse(req.body);
        return res.status(201).json(await createReview(req.session.userId, data));
    } catch (error) {
        next(error);
    }
}

export const getMyReviews = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        return res.status(200).json(await getReceivedReviews(req.session.userId));
    } catch (error) {
        next(error);
    }
}
