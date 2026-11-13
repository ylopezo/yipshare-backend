import {Router} from "express";
import {authenticationHandler} from "@/middlewares/authentication.middleware.ts";
import {withAuthz} from "@/middlewares/authorization.middleware.ts";
import {postReview, getMyReviews} from "@/controllers/review.controller.ts";

const router = Router();

router.post('/', authenticationHandler, withAuthz(postReview));
router.get('/me', authenticationHandler, withAuthz(getMyReviews));

export default router;
