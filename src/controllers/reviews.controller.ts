import type {Response, NextFunction} from "express";
import type {AuthorizedRequest} from "@/middlewares/authorization.middleware.ts";
import {CondominiumReviewQuery, CreateReviewRequest} from "@/schema/reviews.schema.ts";
import {createReview, getCondominiumReviews, getReceivedReviews} from "@/services/reviews.service.ts";
import {CondominiumIdParams} from "@/schema/condominiums.schema.ts";
import {UserIdParams} from "@/schema/users.schema.ts";



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

export const getReviewsOfCondominium = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = CondominiumIdParams.parse(req.params);
        const filter = CondominiumReviewQuery.parse(req.query);
        return res.status(200).json(await getCondominiumReviews(id, filter));
    } catch (error) {
        next(error);
    }
}

export const getUserReviews = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        const {id} = UserIdParams.parse(req.params);
        return res.status(200).json(await getReceivedReviews(id));
    } catch (error) {
        next(error);
    }
}
