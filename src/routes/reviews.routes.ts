import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz, withPermissions} from "@/middlewares/authorization.middleware.ts";
import {postReview, getMyReviews} from "@/controllers/reviews.controller.ts";

const router = Router();

router.post('/', authenticationHandler, withPermissions('users:create.reviews'), withAuthz(postReview));
router.get('/me', authenticationHandler, withPermissions('users:read.reviews.all'), withAuthz(getMyReviews));

export default router;
