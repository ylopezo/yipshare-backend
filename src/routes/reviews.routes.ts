import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {postReview, getMyReviews, getUserReviews} from "@/controllers/reviews.controller.ts";

const router = Router();

router.post('/', authenticationHandler, withPermissions('users:create.reviews'), withAuthz(postReview));
router.get('/me', authenticationHandler, withPermissions('users:read.reviews.all'), withAuthz(getMyReviews));
router.get('/users/:id', authenticationHandler, withPermissions('users:read.profile'), withAuthz(getUserReviews));

export default router;
